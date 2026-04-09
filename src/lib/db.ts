import initSqlJs, { type Database } from "sql.js";
import fs from "fs";
import path from "path";

const DB_DIR = path.resolve("./data");
const DB_PATH = path.join(DB_DIR, "cybervisor.db");

let db: Database | null = null;

function ensureDataDir(): void {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

function saveToDisk(): void {
  if (!db) return;
  ensureDataDir();
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
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

export async function getDb(): Promise<Database> {
  if (db) return db;

  ensureDataDir();
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(CREATE_TABLES_SQL);
  saveToDisk();
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
  read?: number;
  since?: string; // ISO date string
  limit?: number;
  offset?: number;
  search?: string;
}

export async function saveArticle(article: ArticleInput): Promise<void> {
  const d = await getDb();
  d.run(
    `INSERT OR IGNORE INTO articles
      (source_id, title, title_fr, title_en, description, description_fr, description_en, link, pub_date, category, severity, country, language)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
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
    ]
  );
  saveToDisk();
}

export async function getArticles(filters: ArticleFilters = {}): Promise<ArticleRow[]> {
  const d = await getDb();
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

  const stmt = d.prepare(
    `SELECT * FROM articles ${where} ORDER BY collected_at DESC LIMIT ? OFFSET ?`
  );
  stmt.bind([...params, limit, offset]);

  const rows: ArticleRow[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as unknown as ArticleRow);
  }
  stmt.free();
  return rows;
}

export async function getArticleCount(since?: string): Promise<number> {
  const d = await getDb();
  const where = since ? "WHERE collected_at >= ?" : "";
  const params = since ? [since] : [];
  const result = d.exec(`SELECT COUNT(*) as count FROM articles ${where}`, params);
  return result.length > 0 ? (result[0].values[0][0] as number) : 0;
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
}

export async function saveCve(cve: CveInput): Promise<void> {
  const d = await getDb();
  d.run(
    `INSERT OR REPLACE INTO cves
      (cve_id, description, description_fr, cvss_score, cvss_vector, severity, published_date, modified_date, references_json, affected_products)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
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
    ]
  );
  saveToDisk();
}

export async function getCves(filters: CveFilters = {}): Promise<CveRow[]> {
  const d = await getDb();
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

  const stmt = d.prepare(
    `SELECT * FROM cves ${where} ORDER BY collected_at DESC LIMIT ? OFFSET ?`
  );
  stmt.bind([...params, limit, offset]);

  const rows: CveRow[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as unknown as CveRow);
  }
  stmt.free();
  return rows;
}

export async function getCveCount(since?: string): Promise<number> {
  const d = await getDb();
  const where = since ? "WHERE collected_at >= ?" : "";
  const params = since ? [since] : [];
  const result = d.exec(`SELECT COUNT(*) as count FROM cves ${where}`, params);
  return result.length > 0 ? (result[0].values[0][0] as number) : 0;
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

export async function saveSynthesis(synthesis: SynthesisInput): Promise<void> {
  const d = await getDb();
  d.run(
    `INSERT OR REPLACE INTO syntheses
      (date, time_slot, content_fr, content_en, articles_count, cves_count, critical_count)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      synthesis.date,
      synthesis.time_slot,
      synthesis.content_fr ?? null,
      synthesis.content_en ?? null,
      synthesis.articles_count ?? null,
      synthesis.cves_count ?? null,
      synthesis.critical_count ?? null,
    ]
  );
  saveToDisk();
}

export async function getSyntheses(limit: number = 10): Promise<SynthesisRow[]> {
  const d = await getDb();
  const stmt = d.prepare(
    `SELECT * FROM syntheses ORDER BY date DESC, time_slot DESC LIMIT ?`
  );
  stmt.bind([limit]);

  const rows: SynthesisRow[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as unknown as SynthesisRow);
  }
  stmt.free();
  return rows;
}

export async function getLatestSynthesis(): Promise<SynthesisRow | null> {
  const rows = await getSyntheses(1);
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
}

export async function saveAlert(alert: AlertInput): Promise<void> {
  const d = await getDb();
  d.run(
    `INSERT INTO alerts
      (type, title, title_fr, description, severity, source_link)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      alert.type,
      alert.title,
      alert.title_fr ?? null,
      alert.description ?? null,
      alert.severity,
      alert.source_link ?? null,
    ]
  );
  saveToDisk();
}

export async function getAlerts(filters: AlertFilters = {}): Promise<AlertRow[]> {
  const d = await getDb();
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

  const stmt = d.prepare(
    `SELECT * FROM alerts ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  );
  stmt.bind([...params, limit, offset]);

  const rows: AlertRow[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as unknown as AlertRow);
  }
  stmt.free();
  return rows;
}

export async function acknowledgeAlert(id: number): Promise<void> {
  const d = await getDb();
  d.run("UPDATE alerts SET acknowledged = 1 WHERE id = ?", [id]);
  saveToDisk();
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export async function getSetting(key: string): Promise<string | null> {
  const d = await getDb();
  const result = d.exec("SELECT value FROM settings WHERE key = ?", [key]);
  if (result.length > 0 && result[0].values.length > 0) {
    return result[0].values[0][0] as string | null;
  }
  return null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const d = await getDb();
  d.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", [key, value]);
  saveToDisk();
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
  d: Database,
  table: string,
  dateCol: string,
  extraWhere?: string
): { last24h: number; last7d: number; last30d: number; total: number } {
  const extra = extraWhere ? ` AND ${extraWhere}` : "";
  const q = (interval: string) =>
    d.exec(
      `SELECT COUNT(*) FROM ${table} WHERE ${dateCol} >= datetime('now', '${interval}')${extra}`
    );
  const qTotal = d.exec(`SELECT COUNT(*) FROM ${table} ${extraWhere ? `WHERE ${extraWhere}` : ""}`);

  const extract = (r: ReturnType<Database["exec"]>) =>
    r.length > 0 ? (r[0].values[0][0] as number) : 0;

  return {
    last24h: extract(q("-1 day")),
    last7d: extract(q("-7 days")),
    last30d: extract(q("-30 days")),
    total: extract(qTotal),
  };
}

export async function getStats(): Promise<DashboardStats> {
  const d = await getDb();

  const articles = countQuery(d, "articles", "collected_at");
  const cves = countQuery(d, "cves", "collected_at");
  const alertsAll = countQuery(d, "alerts", "created_at");
  const critical = countQuery(d, "alerts", "created_at", "severity = 'critical'");

  const unackResult = d.exec(
    "SELECT COUNT(*) FROM alerts WHERE acknowledged = 0"
  );
  const unacknowledged =
    unackResult.length > 0 ? (unackResult[0].values[0][0] as number) : 0;

  const synthesesResult = d.exec("SELECT COUNT(*) FROM syntheses");
  const synthesesTotal =
    synthesesResult.length > 0 ? (synthesesResult[0].values[0][0] as number) : 0;

  // Top categories from last 7 days
  const catResult = d.exec(
    `SELECT category, COUNT(*) as cnt FROM articles
     WHERE category IS NOT NULL AND collected_at >= datetime('now', '-7 days')
     GROUP BY category ORDER BY cnt DESC LIMIT 10`
  );
  const topCategories =
    catResult.length > 0
      ? catResult[0].values.map((row) => ({
          category: row[0] as string,
          count: row[1] as number,
        }))
      : [];

  // Top countries from last 7 days
  const countryResult = d.exec(
    `SELECT country, COUNT(*) as cnt FROM articles
     WHERE country IS NOT NULL AND collected_at >= datetime('now', '-7 days')
     GROUP BY country ORDER BY cnt DESC LIMIT 10`
  );
  const topCountries =
    countryResult.length > 0
      ? countryResult[0].values.map((row) => ({
          country: row[0] as string,
          count: row[1] as number,
        }))
      : [];

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
