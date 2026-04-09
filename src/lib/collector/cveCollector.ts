import { saveCve, saveAlert, type CveInput, type AlertInput } from "../db";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CveCollectionStats {
  total: number;
  new: number;
  critical: number;
}

interface NvdResponse {
  resultsPerPage: number;
  startIndex: number;
  totalResults: number;
  vulnerabilities: NvdVulnerability[];
}

interface NvdVulnerability {
  cve: {
    id: string;
    descriptions: Array<{ lang: string; value: string }>;
    published: string;
    lastModified: string;
    metrics?: {
      cvssMetricV31?: Array<{
        cvssData: { baseScore: number; vectorString: string; baseSeverity: string };
      }>;
      cvssMetricV30?: Array<{
        cvssData: { baseScore: number; vectorString: string; baseSeverity: string };
      }>;
      cvssMetricV2?: Array<{
        cvssData: { baseScore: number; vectorString: string };
        baseSeverity: string;
      }>;
    };
    references?: Array<{ url: string; source?: string }>;
    configurations?: Array<{
      nodes: Array<{
        cpeMatch: Array<{
          criteria: string;
          vulnerable: boolean;
        }>;
      }>;
    }>;
  };
}

// ---------------------------------------------------------------------------
// NVD API helpers
// ---------------------------------------------------------------------------

const NVD_BASE_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0";
const REQUEST_DELAY_MS = 6_500; // ~5 requests per 30 s without API key
const MAX_RESULTS_PER_PAGE = 2000;

function formatNvdDate(date: Date): string {
  return date.toISOString().replace("Z", "+00:00").replace(/\.\d{3}/, ".000");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchNvdPage(
  startDate: string,
  endDate: string,
  startIndex: number
): Promise<NvdResponse> {
  const params = new URLSearchParams({
    pubStartDate: startDate,
    pubEndDate: endDate,
    startIndex: String(startIndex),
    resultsPerPage: String(MAX_RESULTS_PER_PAGE),
  });

  const url = `${NVD_BASE_URL}?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "CyberVisor/1.0 (CVE Collector)",
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`NVD API error: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as NvdResponse;
}

// ---------------------------------------------------------------------------
// CVE data extraction
// ---------------------------------------------------------------------------

function extractDescription(
  descriptions: Array<{ lang: string; value: string }>
): string | null {
  const en = descriptions.find((d) => d.lang === "en");
  return en?.value ?? descriptions[0]?.value ?? null;
}

function extractCvss(metrics: NvdVulnerability["cve"]["metrics"]): {
  score: number | null;
  vector: string | null;
  severity: string | null;
} {
  if (!metrics) return { score: null, vector: null, severity: null };

  // Prefer v3.1 > v3.0 > v2
  const v31 = metrics.cvssMetricV31?.[0];
  if (v31) {
    return {
      score: v31.cvssData.baseScore,
      vector: v31.cvssData.vectorString,
      severity: v31.cvssData.baseSeverity.toLowerCase(),
    };
  }

  const v30 = metrics.cvssMetricV30?.[0];
  if (v30) {
    return {
      score: v30.cvssData.baseScore,
      vector: v30.cvssData.vectorString,
      severity: v30.cvssData.baseSeverity.toLowerCase(),
    };
  }

  const v2 = metrics.cvssMetricV2?.[0];
  if (v2) {
    return {
      score: v2.cvssData.baseScore,
      vector: v2.cvssData.vectorString,
      severity: v2.baseSeverity?.toLowerCase() ?? null,
    };
  }

  return { score: null, vector: null, severity: null };
}

function extractAffectedProducts(
  configurations: NvdVulnerability["cve"]["configurations"]
): string | null {
  if (!configurations || configurations.length === 0) return null;

  const products = new Set<string>();
  for (const config of configurations) {
    for (const node of config.nodes) {
      for (const match of node.cpeMatch) {
        if (match.vulnerable) {
          // CPE format: cpe:2.3:a:vendor:product:version:...
          const parts = match.criteria.split(":");
          if (parts.length >= 5) {
            const vendor = parts[3];
            const product = parts[4];
            if (vendor !== "*" && product !== "*") {
              products.add(`${vendor}:${product}`);
            }
          }
        }
      }
    }
  }

  return products.size > 0 ? Array.from(products).join(", ") : null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function collectRecentCves(
  hoursBack: number = 6
): Promise<CveCollectionStats> {
  const stats: CveCollectionStats = { total: 0, new: 0, critical: 0 };

  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - hoursBack * 60 * 60 * 1000);

  const startStr = formatNvdDate(startDate);
  const endStr = formatNvdDate(endDate);

  let startIndex = 0;
  let totalResults = Infinity;
  let pageCount = 0;

  while (startIndex < totalResults) {
    // Rate-limit: wait between requests (skip for the first request)
    if (pageCount > 0) {
      await sleep(REQUEST_DELAY_MS);
    }

    let page: NvdResponse;
    try {
      page = await fetchNvdPage(startStr, endStr, startIndex);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[CVE Collector] NVD API request failed at index ${startIndex}: ${msg}`);
      break;
    }

    totalResults = page.totalResults;
    pageCount++;

    for (const vuln of page.vulnerabilities) {
      const cve = vuln.cve;
      const description = extractDescription(cve.descriptions);
      const cvss = extractCvss(cve.metrics);
      const references = cve.references
        ? cve.references.map((r) => r.url)
        : [];
      const affectedProducts = extractAffectedProducts(cve.configurations);

      const cveInput: CveInput = {
        cve_id: cve.id,
        description,
        cvss_score: cvss.score,
        cvss_vector: cvss.vector,
        severity: cvss.severity,
        published_date: cve.published,
        modified_date: cve.lastModified,
        references_json: references.length > 0 ? JSON.stringify(references) : null,
        affected_products: affectedProducts,
      };

      try {
        await saveCve(cveInput);
        stats.new++;
      } catch {
        // INSERT OR REPLACE handles duplicates; genuine errors are rare
      }

      stats.total++;

      // Create critical alert for CVSS >= 9.0
      if (cvss.score !== null && cvss.score >= 9.0) {
        stats.critical++;

        const alertDescription = [
          `CVSS Score: ${cvss.score}`,
          cvss.severity ? `Severity: ${cvss.severity.toUpperCase()}` : null,
          affectedProducts ? `Affected: ${affectedProducts}` : null,
          description ? truncateText(description, 500) : null,
        ]
          .filter(Boolean)
          .join("\n");

        const alert: AlertInput = {
          type: "cve_critical",
          title: `${cve.id} - Critical CVE (CVSS ${cvss.score})`,
          description: alertDescription,
          severity: "critical",
          source_link: `https://nvd.nist.gov/vuln/detail/${cve.id}`,
        };

        try {
          await saveAlert(alert);
        } catch {
          // Alert may already exist or other DB issue; non-fatal
        }
      }
    }

    startIndex += page.resultsPerPage;
  }

  return stats;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + "...";
}
