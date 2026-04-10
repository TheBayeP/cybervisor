import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_DIR = path.resolve("./data");
const DB_PATH = path.join(DB_DIR, "cybervisor.db");

let db: Database.Database | null = null;

function ensureDataDir(): void {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id TEXT NOT NULL,
  title TEXT NOT NULL,
  title_fr TEXT,
  title_en TEXT,
  description TEXT,
  description_fr TEXT,
  description_en TEXT,
  link TEXT UNIQUE NOT NULL,
  pub_date TEXT,
  category TEXT,
  severity TEXT,
  country TEXT,
  language TEXT,
  collected_at TEXT DEFAULT (datetime('now')),
  read INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cve_id TEXT UNIQUE NOT NULL,
  description TEXT,
  description_fr TEXT,
  cvss_score REAL,
  cvss_vector TEXT,
  severity TEXT,
  published_date TEXT,
  modified_date TEXT,
  references_json TEXT,
  affected_products TEXT,
  collected_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS syntheses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  content_fr TEXT,
  content_en TEXT,
  articles_count INTEGER,
  cves_count INTEGER,
  critical_count INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(date, time_slot)
);

CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  title_fr TEXT,
  description TEXT,
  severity TEXT NOT NULL,
  source_link TEXT,
  acknowledged INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
`;

const CREATE_INDEXES_SQL = `
CREATE INDEX IF NOT EXISTS idx_articles_collected_at ON articles(collected_at);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_severity ON articles(severity);
CREATE INDEX IF NOT EXISTS idx_articles_source_id ON articles(source_id);
CREATE INDEX IF NOT EXISTS idx_articles_country ON articles(country);
CREATE INDEX IF NOT EXISTS idx_cves_collected_at ON cves(collected_at);
CREATE INDEX IF NOT EXISTS idx_cves_severity ON cves(severity);
CREATE INDEX IF NOT EXISTS idx_cves_cvss_score ON cves(cvss_score);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON alerts(acknowledged);
`;

export function getDb(): Database.Database {
  if (db) return db;

  ensureDataDir();

  db = new Database(DB_PATH);

  // Enable WAL mode for better concurrent read/write performance
  // and reduced memory usage compared to default journal mode
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 5000");
  db.pragma("cache_size = -2000"); // 2MB cache (negative = KB)
  db.pragma("foreign_keys = ON");

  db.exec(CREATE_TABLES_SQL);
  db.exec(CREATE_INDEXES_SQL);

  return db;
}

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------

export interface ArticleInput {
  source_id: string;
  title: string;
  title_fr?: string | null;
  title_en?: string | null;
  description?: string | null;
  description_fr?: string | null;
  description_en?: string | null;
  link: string;
  pub_date?: string | null;
  category?: string | null;
  severity?: string | null;
  country?: string | null;
  language?: string | null;
}

export interface ArticleRow extends ArticleInput {
  id: number;
  collected_at: string;
  read: number;
}

export interface ArticleFilters {
  category?: string;
  severity?: string;
  country?: string;
  language?: string;
  source_id?: string;
  source_categories?: string[]; // filter by source category (cert, government, research, vendor, threat-intel, news, blog, cve)
  categories?: string[]; // filter by article category (multiple)
  severities?: string[]; // filter by multiple severities
  read?: number;
  since?: string; // ISO date string
  limit?: number;
  offset?: number;
  search?: string;
  sort?: string; // e.g. 'date_desc', 'date_asc', 'severity_desc', 'severity_asc'
}

export function saveArticle(article: ArticleInput): void {
  const d = getDb();
  const stmt = d.prepare(
    `INSERT OR IGNORE INTO articles
      (source_id, title, title_fr, title_en, description, description_fr, description_en, link, pub_date, category, severity, country, language)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  stmt.run(
    article.source_id,
    article.title,
    article.title_fr ?? null,
    article.title_en ?? null,
    article.description ?? null,
    article.description_fr ?? null,
    article.description_en ?? null,
    article.link,
    article.pub_date ?? null,
    article.category ?? null,
    article.severity ?? null,
    article.country ?? null,
    article.language ?? null,
  );
}

/** Batch-insert multiple articles inside a single transaction. */
export function saveArticlesBatch(articles: ArticleInput[]): number {
  const d = getDb();
  const stmt = d.prepare(
    `INSERT OR IGNORE INTO articles
      (source_id, title, title_fr, title_en, description, description_fr, description_en, link, pub_date, category, severity, country, language)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  let inserted = 0;
  const tx = d.transaction((items: ArticleInput[]) => {
    for (const a of items) {
      const info = stmt.run(
        a.source_id,
        a.title,
        a.title_fr ?? null,
        a.title_en ?? null,
        a.description ?? null,
        a.description_fr ?? null,
        a.description_en ?? null,
        a.link,
        a.pub_date ?? null,
        a.category ?? null,
        a.severity ?? null,
        a.country ?? null,
        a.language ?? null,
      );
      if (info.changes > 0) inserted++;
    }
  });

  tx(articles);
  return inserted;
}

export function getArticles(filters: ArticleFilters = {}): ArticleRow[] {
  const d = getDb();
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.category) {
    conditions.push("category = ?");
    params.push(filters.category);
  }
  if (filters.severity) {
    conditions.push("severity = ?");
    params.push(filters.severity);
  }
  if (filters.country) {
    conditions.push("country = ?");
    params.push(filters.country);
  }
  if (filters.language) {
    conditions.push("language = ?");
    params.push(filters.language);
  }
  if (filters.source_id) {
    conditions.push("source_id = ?");
    params.push(filters.source_id);
  }
  if (filters.read !== undefined) {
    conditions.push("read = ?");
    params.push(filters.read);
  }
  if (filters.since) {
    conditions.push("collected_at >= ?");
    params.push(filters.since);
  }
  if (filters.search) {
    conditions.push("(title LIKE ? OR description LIKE ?)");
    const term = `%${filters.search}%`;
    params.push(term, term);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = filters.limit ?? 100;
  const offset = filters.offset ?? 0;

  // Sort: use pub_date only when it is within a reasonable range (2018-now+1d).
  // Feeds sometimes carry very old or future dates — fall back to collected_at in those cases.
  const validDate = `CASE
    WHEN pub_date IS NOT NULL
      AND pub_date >= '2018-01-01'
      AND pub_date <= datetime('now', '+1 day')
    THEN pub_date
    ELSE collected_at
  END`;
  let orderBy = `${validDate} DESC`;
  if (filters.sort === "date_asc") orderBy = `${validDate} ASC`;
  else if (filters.sort === "severity_desc") orderBy = `CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END ASC, ${validDate} DESC`;
  else if (filters.sort === "severity_asc") orderBy = `CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END DESC, ${validDate} ASC`;

  const stmt = d.prepare(
    `SELECT * FROM articles ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`
  );
  return stmt.all(...params, limit, offset) as ArticleRow[];
}

export function getArticleCount(filters: {
  category?: string;
  severity?: string;
  source_id?: string;
  country?: string;
  since?: string;
  endDate?: string;
  search?: string;
} = {}): number {
  const d = getDb();
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.category) { conditions.push("category = ?"); params.push(filters.category); }
  if (filters.severity) { conditions.push("severity = ?"); params.push(filters.severity); }
  if (filters.source_id) { conditions.push("source_id = ?"); params.push(filters.source_id); }
  if (filters.country) { conditions.push("country = ?"); params.push(filters.country); }
  if (filters.since) { conditions.push("collected_at >= ?"); params.push(filters.since); }
  if (filters.endDate) { conditions.push("collected_at <= ?"); params.push(filters.endDate); }
  if (filters.search) {
    conditions.push("(title LIKE ? OR description LIKE ?)");
    const term = `%${filters.search}%`;
    params.push(term, term);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const row = d.prepare(`SELECT COUNT(*) as count FROM articles ${where}`).get(...params) as { count: number } | undefined;
  return row?.count ?? 0;
}

// ---------------------------------------------------------------------------
// CVEs
// ---------------------------------------------------------------------------

export interface CveInput {
  cve_id: string;
  description?: string | null;
  description_fr?: string | null;
  cvss_score?: number | null;
  cvss_vector?: string | null;
  severity?: string | null;
  published_date?: string | null;
  modified_date?: string | null;
  references_json?: string | null;
  affected_products?: string | null;
}

export interface CveRow extends CveInput {
  id: number;
  collected_at: string;
}

export interface CveFilters {
  severity?: string;
  min_cvss?: number;
  since?: string;
  search?: string;
  limit?: number;
  offset?: number;
  sort?: string; // e.g. 'date_desc', 'date_asc', 'severity_desc', 'severity_asc'
}

export function saveCve(cve: CveInput): void {
  const d = getDb();
  d.prepare(
    `INSERT OR REPLACE INTO cves
      (cve_id, description, description_fr, cvss_score, cvss_vector, severity, published_date, modified_date, references_json, affected_products)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    cve.cve_id,
    cve.description ?? null,
    cve.description_fr ?? null,
    cve.cvss_score ?? null,
    cve.cvss_vector ?? null,
    cve.severity ?? null,
    cve.published_date ?? null,
    cve.modified_date ?? null,
    cve.references_json ?? null,
    cve.affected_products ?? null,
  );
}

export function getCves(filters: CveFilters = {}): CveRow[] {
  const d = getDb();
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.severity) {
    conditions.push("severity = ?");
    params.push(filters.severity);
  }
  if (filters.min_cvss !== undefined) {
    conditions.push("cvss_score >= ?");
    params.push(filters.min_cvss);
  }
  if (filters.since) {
    conditions.push("collected_at >= ?");
    params.push(filters.since);
  }
  if (filters.search) {
    conditions.push("(cve_id LIKE ? OR description LIKE ? OR affected_products LIKE ?)");
    const term = `%${filters.search}%`;
    params.push(term, term, term);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = filters.limit ?? 100;
  const offset = filters.offset ?? 0;

  // Sort
  let orderBy = "collected_at DESC";
  if (filters.sort === "date_asc") orderBy = "collected_at ASC";
  else if (filters.sort === "severity_desc") orderBy = "CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END ASC, cvss_score DESC";
  else if (filters.sort === "severity_asc") orderBy = "CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END DESC, cvss_score ASC";

  return d.prepare(
    `SELECT * FROM cves ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`
  ).all(...params, limit, offset) as CveRow[];
}

export function getCveCount(filters: {
  severity?: string;
  min_cvss?: number;
  max_cvss?: number;
  search?: string;
} = {}): number {
  const d = getDb();
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.severity) { conditions.push("severity = ?"); params.push(filters.severity); }
  if (filters.min_cvss !== undefined) { conditions.push("cvss_score >= ?"); params.push(filters.min_cvss); }
  if (filters.max_cvss !== undefined) { conditions.push("cvss_score <= ?"); params.push(filters.max_cvss); }
  if (filters.search) {
    conditions.push("(cve_id LIKE ? OR description LIKE ? OR affected_products LIKE ?)");
    const term = `%${filters.search}%`;
    params.push(term, term, term);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const row = d.prepare(`SELECT COUNT(*) as count FROM cves ${where}`).get(...params) as { count: number } | undefined;
  return row?.count ?? 0;
}

// ---------------------------------------------------------------------------
// Syntheses
// ---------------------------------------------------------------------------

export interface SynthesisInput {
  date: string;
  time_slot: string;
  content_fr?: string | null;
  content_en?: string | null;
  articles_count?: number | null;
  cves_count?: number | null;
  critical_count?: number | null;
}

export interface SynthesisRow extends SynthesisInput {
  id: number;
  created_at: string;
}

export function saveSynthesis(synthesis: SynthesisInput): void {
  const d = getDb();
  d.prepare(
    `INSERT OR REPLACE INTO syntheses
      (date, time_slot, content_fr, content_en, articles_count, cves_count, critical_count)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    synthesis.date,
    synthesis.time_slot,
    synthesis.content_fr ?? null,
    synthesis.content_en ?? null,
    synthesis.articles_count ?? null,
    synthesis.cves_count ?? null,
    synthesis.critical_count ?? null,
  );
}

export function getSyntheses(limit: number = 10): SynthesisRow[] {
  const d = getDb();
  return d.prepare(
    `SELECT * FROM syntheses ORDER BY date DESC, time_slot DESC LIMIT ?`
  ).all(limit) as SynthesisRow[];
}

export function getLatestSynthesis(): SynthesisRow | null {
  const rows = getSyntheses(1);
  return rows.length > 0 ? rows[0] : null;
}

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

export interface AlertInput {
  type: string;
  title: string;
  title_fr?: string | null;
  description?: string | null;
  severity: string;
  source_link?: string | null;
}

export interface AlertRow extends AlertInput {
  id: number;
  acknowledged: number;
  created_at: string;
}

export interface AlertFilters {
  type?: string;
  severity?: string;
  acknowledged?: number;
  since?: string;
  limit?: number;
  offset?: number;
  sort?: string;
}

export function saveAlert(alert: AlertInput): void {
  const d = getDb();
  d.prepare(
    `INSERT INTO alerts
      (type, title, title_fr, description, severity, source_link)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    alert.type,
    alert.title,
    alert.title_fr ?? null,
    alert.description ?? null,
    alert.severity,
    alert.source_link ?? null,
  );
}

export function getAlerts(filters: AlertFilters = {}): AlertRow[] {
  const d = getDb();
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.type) {
    conditions.push("type = ?");
    params.push(filters.type);
  }
  if (filters.severity) {
    conditions.push("severity = ?");
    params.push(filters.severity);
  }
  if (filters.acknowledged !== undefined) {
    conditions.push("acknowledged = ?");
    params.push(filters.acknowledged);
  }
  if (filters.since) {
    conditions.push("created_at >= ?");
    params.push(filters.since);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = filters.limit ?? 100;
  const offset = filters.offset ?? 0;

  // Sort
  let orderBy = "created_at DESC";
  if (filters.sort === "date_asc") orderBy = "created_at ASC";
  else if (filters.sort === "severity_desc") orderBy = "CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END ASC";
  else if (filters.sort === "severity_asc") orderBy = "CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END DESC";

  return d.prepare(
    `SELECT * FROM alerts ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`
  ).all(...params, limit, offset) as AlertRow[];
}

export function acknowledgeAlert(id: number): void {
  const d = getDb();
  d.prepare("UPDATE alerts SET acknowledged = 1 WHERE id = ?").run(id);
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export function getSetting(key: string): string | null {
  const d = getDb();
  const row = d.prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string | null } | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  const d = getDb();
  d.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(key, value);
}

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export interface DashboardStats {
  articles: { last24h: number; last7d: number; last30d: number; total: number };
  cves: { last24h: number; last7d: number; last30d: number; total: number };
  alerts: {
    last24h: number;
    last7d: number;
    last30d: number;
    total: number;
    unacknowledged: number;
  };
  critical: {
    last24h: number;
    last7d: number;
    last30d: number;
  };
  syntheses: { total: number };
  topCategories: Array<{ category: string; count: number }>;
  topCountries: Array<{ country: string; count: number }>;
}

function countQuery(
  d: Database.Database,
  table: string,
  dateCol: string,
  extraWhere?: string
): { last24h: number; last7d: number; last30d: number; total: number } {
  const extra = extraWhere ? ` AND ${extraWhere}` : "";
  const q = (interval: string) => {
    const row = d.prepare(
      `SELECT COUNT(*) as count FROM ${table} WHERE ${dateCol} >= datetime('now', '${interval}')${extra}`
    ).get() as { count: number };
    return row.count;
  };
  const totalRow = d.prepare(
    `SELECT COUNT(*) as count FROM ${table} ${extraWhere ? `WHERE ${extraWhere}` : ""}`
  ).get() as { count: number };

  return {
    last24h: q("-1 day"),
    last7d: q("-7 days"),
    last30d: q("-30 days"),
    total: totalRow.count,
  };
}

export function getStats(): DashboardStats {
  const d = getDb();

  const articles = countQuery(d, "articles", "collected_at");
  const cves = countQuery(d, "cves", "collected_at");
  const alertsAll = countQuery(d, "alerts", "created_at");
  const critical = countQuery(d, "alerts", "created_at", "severity = 'critical'");

  const unackRow = d.prepare(
    "SELECT COUNT(*) as count FROM alerts WHERE acknowledged = 0"
  ).get() as { count: number };
  const unacknowledged = unackRow.count;

  const synthesesRow = d.prepare("SELECT COUNT(*) as count FROM syntheses").get() as { count: number };
  const synthesesTotal = synthesesRow.count;

  // Top categories from last 7 days
  const topCategories = d.prepare(
    `SELECT category, COUNT(*) as count FROM articles
     WHERE category IS NOT NULL AND collected_at >= datetime('now', '-7 days')
     GROUP BY category ORDER BY count DESC LIMIT 10`
  ).all() as Array<{ category: string; count: number }>;

  // Top countries from last 7 days
  const topCountries = d.prepare(
    `SELECT country, COUNT(*) as count FROM articles
     WHERE country IS NOT NULL AND collected_at >= datetime('now', '-7 days')
     GROUP BY country ORDER BY count DESC LIMIT 10`
  ).all() as Array<{ country: string; count: number }>;

  return {
    articles,
    cves,
    alerts: { ...alertsAll, unacknowledged },
    critical: {
      last24h: critical.last24h,
      last7d: critical.last7d,
      last30d: critical.last30d,
    },
    syntheses: { total: synthesesTotal },
    topCategories,
    topCountries,
  };
}

// ---------------------------------------------------------------------------
// Data purge (to keep memory and disk usage under control)
// ---------------------------------------------------------------------------

export interface PurgeStats {
  articles: number;
  cves: number;
  alerts: number;
}

export function purgeOldData(
  articleDays: number = 90,
  cveDays: number = 180,
  alertDays: number = 30
): PurgeStats {
  const d = getDb();

  const artResult = d.prepare(
    `DELETE FROM articles WHERE collected_at < datetime('now', ?)`
  ).run(`-${articleDays} days`);

  const cveResult = d.prepare(
    `DELETE FROM cves WHERE collected_at < datetime('now', ?)`
  ).run(`-${cveDays} days`);

  const alertResult = d.prepare(
    `DELETE FROM alerts WHERE acknowledged = 1 AND created_at < datetime('now', ?)`
  ).run(`-${alertDays} days`);

  // Reclaim disk space after large deletes
  if (artResult.changes + cveResult.changes + alertResult.changes > 100) {
    d.pragma("wal_checkpoint(TRUNCATE)");
  }

  return {
    articles: artResult.changes,
    cves: cveResult.changes,
    alerts: alertResult.changes,
  };
}
