import Anthropic from "@anthropic-ai/sdk";
import {
  getArticles,
  getCves,
  getLatestSynthesis,
  saveSynthesis,
  getSetting,
  type ArticleRow,
  type CveRow,
  type SynthesisRow,
} from "../db";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TimeSlot = "08:00" | "14:00";

export interface GeneratedSynthesis {
  date: string;
  time_slot: TimeSlot;
  content_fr: string;
  content_en: string;
  articles_count: number;
  cves_count: number;
  critical_count: number;
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are CyberVisor, an AI cybersecurity analyst assistant for CISOs (RSSI).
You produce concise, actionable daily security briefs.
Always structure your output with clear sections using markdown.
Reference previous briefs for continuity when available.
Focus on what matters most to a CISO: critical vulnerabilities, active threats, and required actions.`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatArticlesForPrompt(articles: ArticleRow[]): string {
  if (articles.length === 0) return "No new articles since last brief.";

  return articles
    .map((a, i) => {
      const title = a.title_en || a.title_fr || a.title;
      const desc = a.description_en || a.description_fr || a.description || "";
      const sev = a.severity ? ` [${a.severity.toUpperCase()}]` : "";
      return `${i + 1}. ${title}${sev}\n   Source: ${a.source_id} | Category: ${a.category || "N/A"} | Date: ${a.pub_date || a.collected_at}\n   ${desc.slice(0, 300)}`;
    })
    .join("\n\n");
}

function formatCvesForPrompt(cves: CveRow[]): string {
  if (cves.length === 0) return "No new CVEs since last brief.";

  return cves
    .map((c, i) => {
      const cvss = c.cvss_score != null ? ` (CVSS: ${c.cvss_score})` : "";
      const sev = c.severity ? ` [${c.severity.toUpperCase()}]` : "";
      const products = c.affected_products || "N/A";
      const desc = c.description || "";
      return `${i + 1}. ${c.cve_id}${cvss}${sev}\n   Affected: ${products}\n   ${desc.slice(0, 250)}`;
    })
    .join("\n\n");
}

function buildUserPrompt(
  timeSlot: TimeSlot,
  articles: ArticleRow[],
  cves: CveRow[],
  criticalCves: CveRow[],
  previousSynthesis: SynthesisRow | null
): string {
  const slotLabel = timeSlot === "08:00" ? "Morning" : "Afternoon";
  const today = todayISO();

  let prompt = `Generate the ${slotLabel} RSSI Security Brief for ${today}.

The brief must:
- Be readable in under 10 minutes
- Highlight critical CVEs (CVSS 9+)
- Summarize major attacks and incidents
- List important vulnerabilities to patch
- Mention emerging threats and trends
- Provide actionable recommendations for the CISO/RSSI
- Use structured markdown with clear sections

IMPORTANT: Produce the brief in TWO languages. Output the French version first, then the English version, separated by the exact marker:
---LANG_SEPARATOR---

Each version should have these sections:
## Tableau de bord / Dashboard
## Vulnérabilités critiques / Critical Vulnerabilities
## Incidents et attaques / Incidents & Attacks
## Tendances émergentes / Emerging Trends
## Recommandations / Recommendations
## Continuité / Continuity (reference to previous brief if applicable)

--- DATA ---

### New Articles (${articles.length} total):
${formatArticlesForPrompt(articles)}

### New CVEs (${cves.length} total, ${criticalCves.length} critical with CVSS >= 9):
${formatCvesForPrompt(cves)}`;

  if (previousSynthesis?.content_en) {
    prompt += `

### Previous Brief Summary (for continuity):
${previousSynthesis.content_en.slice(0, 500)}`;
  } else if (previousSynthesis?.content_fr) {
    prompt += `

### Previous Brief Summary (for continuity):
${previousSynthesis.content_fr.slice(0, 500)}`;
  }

  return prompt;
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

export async function generateSynthesis(
  timeSlot: TimeSlot
): Promise<GeneratedSynthesis> {
  // Resolve API key: DB setting takes precedence, then env var
  const dbKey = getSetting("claude_api_key");
  const apiKey = dbKey || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      "No Claude API key configured. Set it via settings (claude_api_key) or ANTHROPIC_API_KEY env var."
    );
  }

  // Fetch the previous synthesis for continuity context
  const previousSynthesis = getLatestSynthesis();

  // Determine the "since" cutoff: use previous synthesis date or fall back to 12h ago
  const sinceDate = previousSynthesis?.created_at
    ? previousSynthesis.created_at
    : new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();

  // Collect articles and CVEs since last synthesis
  const articles = getArticles({ since: sinceDate, limit: 50 });
  const cves = getCves({ since: sinceDate, limit: 50 });
  const criticalCves = cves.filter(
    (c) => c.cvss_score != null && c.cvss_score >= 9
  );

  // Build the prompt
  const userPrompt = buildUserPrompt(
    timeSlot,
    articles,
    cves,
    criticalCves,
    previousSynthesis
  );

  // Call Claude API
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  // Extract text content from the response
  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude API returned no text content.");
  }

  const fullText = textBlock.text;

  // Split French / English by the separator marker
  const separatorIndex = fullText.indexOf("---LANG_SEPARATOR---");
  let contentFr: string;
  let contentEn: string;

  if (separatorIndex !== -1) {
    contentFr = fullText.slice(0, separatorIndex).trim();
    contentEn = fullText.slice(separatorIndex + "---LANG_SEPARATOR---".length).trim();
  } else {
    // Fallback: use the full output for both if separator is missing
    contentFr = fullText;
    contentEn = fullText;
  }

  const today = todayISO();

  const synthesis: GeneratedSynthesis = {
    date: today,
    time_slot: timeSlot,
    content_fr: contentFr,
    content_en: contentEn,
    articles_count: articles.length,
    cves_count: cves.length,
    critical_count: criticalCves.length,
  };

  // Persist to database
  saveSynthesis(synthesis);

  return synthesis;
}
