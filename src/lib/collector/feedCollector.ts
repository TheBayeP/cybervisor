import RssParser from "rss-parser";
import { sources, getSourceById, type Source } from "../sources";
import { saveArticle, type ArticleInput } from "../db";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FeedCollectionStats {
  total: number;
  new: number;
  errors: number;
  bySource: Record<string, { total: number; new: number; error?: string }>;
}

// ---------------------------------------------------------------------------
// Keyword maps for auto-categorization and severity
// ---------------------------------------------------------------------------

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  vulnerability: ["vulnerability", "vuln", "cve-", "exploit", "rce", "xss", "sqli", "sql injection", "buffer overflow", "use-after-free"],
  malware: ["malware", "trojan", "worm", "backdoor", "rootkit", "botnet", "infostealer", "stealer", "loader", "dropper", "rat "],
  ransomware: ["ransomware", "ransom", "lockbit", "blackcat", "alphv", "conti", "ryuk", "clop", "akira"],
  phishing: ["phishing", "spear-phishing", "social engineering", "credential harvesting", "bec", "business email compromise"],
  "zero-day": ["zero-day", "0-day", "zero day", "0day", "in-the-wild"],
  patch: ["patch", "update", "hotfix", "security update", "security advisory", "security bulletin", "firmware update"],
  "data-breach": ["data breach", "data leak", "data exposure", "leak", "exposed data", "compromised data"],
  attack: ["attack", "apt", "threat actor", "campaign", "intrusion", "cyberattack", "cyber attack", "ddos", "dos attack"],
  "threat-intel": ["threat intelligence", "ioc", "indicator of compromise", "ttps", "mitre att&ck", "threat landscape"],
};

const SEVERITY_KEYWORDS: Record<string, string[]> = {
  critical: ["critical", "zero-day", "0-day", "actively exploited", "emergency", "rce", "remote code execution", "pre-auth", "unauthenticated"],
  high: ["high", "severe", "important", "dangerous", "widespread", "mass exploitation"],
  medium: ["medium", "moderate", "elevated"],
  low: ["low", "informational", "minor"],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function detectCategory(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return category;
    }
  }
  return null;
}

function detectSeverity(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [severity, keywords] of Object.entries(SEVERITY_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return severity;
    }
  }
  return null;
}

function stripHtml(html: string | undefined): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + "...";
}

// ---------------------------------------------------------------------------
// Concurrency limiter
// ---------------------------------------------------------------------------

async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let idx = 0;

  async function worker(): Promise<void> {
    while (idx < tasks.length) {
      const currentIdx = idx++;
      results[currentIdx] = await tasks[currentIdx]();
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () =>
    worker()
  );
  await Promise.all(workers);
  return results;
}

// ---------------------------------------------------------------------------
// Core collection logic
// ---------------------------------------------------------------------------

const parser = new RssParser({
  timeout: 10_000,
  headers: {
    "User-Agent": "CyberVisor/1.0 (RSS Feed Collector)",
    Accept: "application/rss+xml, application/xml, text/xml, application/atom+xml",
  },
  maxRedirects: 3,
});

interface SingleFeedResult {
  total: number;
  new: number;
  error?: string;
}

async function fetchAndSaveFeed(source: Source): Promise<SingleFeedResult> {
  const result: SingleFeedResult = { total: 0, new: 0 };

  try {
    const feed = await parser.parseURL(source.url);
    const items = feed.items ?? [];
    result.total = items.length;

    for (const item of items) {
      const title = item.title?.trim();
      const link = item.link?.trim();
      if (!title || !link) continue;

      const rawDescription = stripHtml(
        item.contentSnippet || item.content || item.summary || item.description
      );
      const description = truncate(rawDescription, 2000);

      const combinedText = `${title} ${description}`;
      const category = detectCategory(combinedText) ?? source.category;
      const severity = detectSeverity(combinedText) ?? null;

      const pubDate = item.pubDate || item.isoDate || null;

      const article: ArticleInput = {
        source_id: source.id,
        title,
        description: description || null,
        link,
        pub_date: pubDate,
        category,
        severity,
        country: source.country,
        language: source.language,
      };

      try {
        await saveArticle(article);
        result.new++;
      } catch {
        // INSERT OR IGNORE means duplicates silently skip; if we get here
        // it's a genuine DB error, but we count the item as processed.
      }
    }
  } catch (err) {
    result.error =
      err instanceof Error ? err.message : String(err);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function collectAllFeeds(): Promise<FeedCollectionStats> {
  const stats: FeedCollectionStats = {
    total: 0,
    new: 0,
    errors: 0,
    bySource: {},
  };

  const tasks = sources.map(
    (source) => () =>
      fetchAndSaveFeed(source).then((result) => ({
        sourceId: source.id,
        result,
      }))
  );

  const results = await runWithConcurrency(tasks, 10);

  for (const { sourceId, result } of results) {
    stats.bySource[sourceId] = {
      total: result.total,
      new: result.new,
      ...(result.error ? { error: result.error } : {}),
    };
    stats.total += result.total;
    stats.new += result.new;
    if (result.error) stats.errors++;
  }

  return stats;
}

export async function collectSingleFeed(
  sourceId: string
): Promise<SingleFeedResult> {
  const source = getSourceById(sourceId);
  if (!source) {
    return { total: 0, new: 0, error: `Source not found: ${sourceId}` };
  }
  return fetchAndSaveFeed(source);
}
