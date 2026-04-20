import Anthropic from "@anthropic-ai/sdk";
import {
  getArticles,
  getCves,
  getLatestSynthesis,
  saveSynthesis,
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
// Relevance filtering — only pass high-signal content to the AI
// ---------------------------------------------------------------------------

const HIGH_SIGNAL_CATEGORIES = new Set([
  "vulnerability", "ransomware", "zero-day", "attack", "malware",
  "phishing", "data-breach", "threat-intel",
]);

const HIGH_SIGNAL_SEVERITIES = new Set(["critical", "high"]);

function filterHighSignalArticles(articles: ArticleRow[]): ArticleRow[] {
  // Priority 1: critical/high severity
  const urgent = articles
    .filter((a) => a.severity && HIGH_SIGNAL_SEVERITIES.has(a.severity))
    .sort((a, b) => {
      // critical before high
      if (a.severity === "critical" && b.severity !== "critical") return -1;
      if (b.severity === "critical" && a.severity !== "critical") return 1;
      return 0;
    });

  // Priority 2: high-signal categories
  const relevant = articles
    .filter(
      (a) =>
        !urgent.includes(a) &&
        a.category &&
        HIGH_SIGNAL_CATEGORIES.has(a.category)
    );

  // Priority 3: government/cert sources (always relevant)
  const cert = articles.filter(
    (a) =>
      !urgent.includes(a) &&
      !relevant.includes(a) &&
      (a.source_id?.includes("cert") ||
        a.source_id?.includes("anssi") ||
        a.source_id?.includes("cisa") ||
        a.source_id?.includes("ncsc") ||
        a.source_id?.includes("enisa"))
  );

  // Take best 30 total, weighted toward urgent
  return [...urgent.slice(0, 15), ...relevant.slice(0, 10), ...cert.slice(0, 5)].slice(0, 30);
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `Tu es CyberVisor, analyste cybersécurité senior travaillant pour un RSSI.

Ta mission : produire un **brief de sécurité concis, factuel et actionnable**.

RÈGLES ABSOLUES :
1. Ne mentionne QUE les événements à impact élevé ou critique
2. Ignore les articles d'opinion, tutoriels, annonces produit sans CVE, 
   et tout ce qui ne présente pas de risque concret pour une organisation
3. Maximum 5 points par section — priorise la qualité sur la quantité
4. Chaque point = 2-3 lignes max : fait + impact + action
5. Utilise le markdown pour la lisibilité (## titres, **gras**, listes -)
6. Utilise ces préfixes pour aider le scan visuel :
   🔴 = urgence (exploit actif, 0-day)
   🟠 = important (CVE critique, patch requis)  
   🟡 = à surveiller (tendance, risque potentiel)
   ✅ = bonne nouvelle ou correction disponible
   📊 = statistique ou tendance chiffrée`;

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

function formatArticlesForPrompt(articles: ArticleRow[]): string {
  if (articles.length === 0) return "Aucun article pertinent depuis le dernier brief.";

  return articles
    .map((a, i) => {
      const title = a.title_en || a.title_fr || a.title;
      const desc = a.description_en || a.description_fr || a.description || "";
      const sev = a.severity ? ` [${a.severity.toUpperCase()}]` : "";
      const cat = a.category ? ` | ${a.category}` : "";
      return `${i + 1}. ${title}${sev}\n   Source: ${a.source_id}${cat} | ${a.pub_date || a.collected_at}\n   ${desc.slice(0, 250)}`;
    })
    .join("\n\n");
}

function formatCvesForPrompt(cves: CveRow[]): string {
  if (cves.length === 0) return "Aucune CVE critique depuis le dernier brief.";

  return cves
    .map((c, i) => {
      const cvss = c.cvss_score != null ? `CVSS ${c.cvss_score}` : "Score inconnu";
      const sev = c.severity ? ` [${c.severity.toUpperCase()}]` : "";
      const products = c.affected_products
        ? c.affected_products.slice(0, 150)
        : "Produits non spécifiés";
      const desc = (c.description || "").slice(0, 200);
      return `${i + 1}. ${c.cve_id} — ${cvss}${sev}\n   Produits: ${products}\n   ${desc}`;
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
  const slotLabel = timeSlot === "08:00" ? "Matin" : "Après-midi";
  const today = new Date().toISOString().slice(0, 10);
  const criticalCveList = criticalCves.slice(0, 10); // max 10 critical CVEs

  let prompt = `Génère le Brief RSSI ${slotLabel} du ${today}.

## Données disponibles

### Articles de sécurité pertinents (${articles.length} sélectionnés sur un corpus plus large) :
${formatArticlesForPrompt(articles)}

### CVEs critiques (CVSS ≥ 9.0) — ${criticalCveList.length} sur ${cves.length} total :
${formatCvesForPrompt(criticalCveList)}

## Structure attendue (en FRANÇAIS puis en ANGLAIS séparés par ---LANG_SEPARATOR---)

Chaque version doit avoir exactement ces sections :

## 🚨 Urgences & Exploitations actives
(CVE exploitées in-the-wild, 0-day, attaques en cours — MAX 5 points)
(Écrire "Aucune urgence critique détectée ce jour." si rien de significatif)

## 🔧 Vulnérabilités prioritaires à corriger
(CVE critiques demandant un patch — MAX 5 points avec priorité d'action)
(Écrire "Aucune vulnérabilité prioritaire nouvelle." si rien de significatif)

## 🎯 Menaces & Tendances à surveiller
(Campagnes APT, ransomware, nouvelles TTPs — MAX 4 points)
(Écrire "Paysage stable depuis le dernier brief." si rien de significatif)

## ✅ Recommandations RSSI
(Actions concrètes et priorisées — exactement 3-5 points maximum)

## 📊 En chiffres
(3-5 métriques clés : nb CVE critiques, secteurs ciblés, évolution par rapport à hier)`;

  if (previousSynthesis?.content_fr) {
    prompt += `\n\n## Contexte (brief précédent — pour continuité uniquement) :
${previousSynthesis.content_fr.slice(0, 400)}`;
  }

  return prompt;
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

export async function generateSynthesis(
  timeSlot: TimeSlot
): Promise<GeneratedSynthesis> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Pas de clé API Claude configurée. Ajoutez ANTHROPIC_API_KEY dans .env.local."
    );
  }

  const previousSynthesis = getLatestSynthesis();

  // Cutoff: since last synthesis or last 12h
  const sinceDate = previousSynthesis?.created_at
    ? previousSynthesis.created_at
    : new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();

  // Fetch recent articles and filter to high-signal only
  const allArticles = getArticles({ since: sinceDate, limit: 200 });
  const articles = filterHighSignalArticles(allArticles);

  // CVEs since last synthesis — only CVSS ≥ 8.0 for the brief
  const allCves = getCves({ since: sinceDate, limit: 100 });
  const cves = allCves.filter((c) => c.cvss_score != null && c.cvss_score >= 8.0);
  const criticalCves = cves.filter((c) => c.cvss_score != null && c.cvss_score >= 9.0);

  const userPrompt = buildUserPrompt(
    timeSlot,
    articles,
    cves,
    criticalCves,
    previousSynthesis
  );

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4000, // doubled for higher quality
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("L'API Claude n'a pas retourné de contenu textuel.");
  }

  const fullText = textBlock.text;

  const separatorIndex = fullText.indexOf("---LANG_SEPARATOR---");
  let contentFr: string;
  let contentEn: string;

  if (separatorIndex !== -1) {
    contentFr = fullText.slice(0, separatorIndex).trim();
    contentEn = fullText.slice(separatorIndex + "---LANG_SEPARATOR---".length).trim();
  } else {
    contentFr = fullText;
    contentEn = fullText;
  }

  const today = new Date().toISOString().slice(0, 10);

  const synthesis: GeneratedSynthesis = {
    date: today,
    time_slot: timeSlot,
    content_fr: contentFr,
    content_en: contentEn,
    articles_count: articles.length,
    cves_count: cves.length,
    critical_count: criticalCves.length,
  };

  saveSynthesis(synthesis);
  return synthesis;
}
