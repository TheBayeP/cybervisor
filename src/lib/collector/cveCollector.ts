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
    references?: Array<{ url: string; source?: string; tags?: string[] }>;
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
// Major vendors — CVEs on these products are always worth alerting
// ---------------------------------------------------------------------------

const MAJOR_VENDORS = new Set([
  "microsoft", "apple", "google", "cisco", "fortinet", "paloaltonetworks",
  "juniper", "vmware", "broadcom", "oracle", "adobe", "sap", "ivanti",
  "citrix", "f5", "barracuda", "sonicwall", "watchguard", "checkpoint",
  "aruba", "netgear", "zyxel", "dlink", "linksys", "tp-link",
  "atlassian", "veeam", "progress", "moveit", "papercut", "openssl",
  "apache", "nginx", "linux", "canonical", "redhat", "debian",
  "wordpress", "drupal", "moodle", "confluence", "jira", "jenkins",
  "openssl", "openssh", "curl", "log4j", "spring", "struts",
]);

// Keywords indicating active exploitation
const EXPLOITATION_KEYWORDS = [
  "actively exploited", "exploited in the wild", "in-the-wild", "in the wild",
  "zero-day", "0-day", "0day", "under active attack", "mass exploitation",
  "wormable", "exploited by", "ransomware", "threat actor", "proof-of-concept",
  "poc available", "metasploit", "exploit code",
];

// ---------------------------------------------------------------------------
// NVD API helpers
// ---------------------------------------------------------------------------

const NVD_BASE_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0";
const REQUEST_DELAY_MS = 6_500; // ~5 requests per 30s without API key
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
): { display: string | null; vendors: string[] } {
  if (!configurations || configurations.length === 0) {
    return { display: null, vendors: [] };
  }

  const products = new Map<string, Set<string>>();
  for (const config of configurations) {
    for (const node of config.nodes) {
      for (const match of node.cpeMatch) {
        if (match.vulnerable) {
          const parts = match.criteria.split(":");
          if (parts.length >= 5) {
            const vendor = parts[3];
            const product = parts[4];
            if (vendor !== "*" && product !== "*") {
              if (!products.has(vendor)) products.set(vendor, new Set());
              products.get(vendor)!.add(product);
            }
          }
        }
      }
    }
  }

  const vendors = Array.from(products.keys());
  const entries = vendors.map((v) => {
    const prods = Array.from(products.get(v)!).slice(0, 3).join(", ");
    return `${v}: ${prods}`;
  });

  return {
    display: entries.length > 0 ? entries.join(" | ") : null,
    vendors,
  };
}

// ---------------------------------------------------------------------------
// Alert relevance scoring
// ---------------------------------------------------------------------------

interface AlertRelevance {
  shouldAlert: boolean;
  alertType: string;
  reason: string;
  priority: "critical" | "high";
}

function assessAlertRelevance(
  cveId: string,
  cvssScore: number,
  description: string | null,
  vendors: string[],
  references: NvdVulnerability["cve"]["references"]
): AlertRelevance | null {
  if (cvssScore < 9.0) return null; // Only CVSS ≥ 9.0

  const descLower = (description ?? "").toLowerCase();

  // Check for active exploitation indicators
  const isActivelyExploited = EXPLOITATION_KEYWORDS.some((kw) =>
    descLower.includes(kw)
  );

  // Check reference tags for known exploitation
  const refTags = references?.flatMap((r) => r.tags ?? []).map((t) => t.toLowerCase()) ?? [];
  const hasExploitedTag =
    refTags.includes("exploited") ||
    refTags.includes("exploit") ||
    refTags.includes("third-party-advisory");

  // Check if major vendor is affected
  const affectsKnownVendor = vendors.some((v) =>
    MAJOR_VENDORS.has(v.toLowerCase())
  );

  // Always alert for actively exploited CVEs
  if (isActivelyExploited || hasExploitedTag) {
    return {
      shouldAlert: true,
      alertType: "cve_critical_exploited",
      reason: "Actively exploited in the wild",
      priority: "critical",
    };
  }

  // Alert for CVSS ≥ 9.5 on any product (extremely critical)
  if (cvssScore >= 9.5) {
    return {
      shouldAlert: true,
      alertType: affectsKnownVendor ? "cve_critical_major_vendor" : "cve_critical",
      reason: `CVSS ${cvssScore} — exceptionally critical severity`,
      priority: "critical",
    };
  }

  // Alert for CVSS ≥ 9.0 only if a major vendor is affected
  if (cvssScore >= 9.0 && affectsKnownVendor) {
    return {
      shouldAlert: true,
      alertType: "cve_critical_major_vendor",
      reason: `CVSS ${cvssScore} on major vendor product`,
      priority: "critical",
    };
  }

  return null; // Not relevant enough
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
      const references = cve.references ?? [];
      const { display: affectedProducts, vendors } = extractAffectedProducts(cve.configurations);

      const cveInput: CveInput = {
        cve_id: cve.id,
        description,
        cvss_score: cvss.score,
        cvss_vector: cvss.vector,
        severity: cvss.severity,
        published_date: cve.published,
        modified_date: cve.lastModified,
        references_json: references.length > 0 ? JSON.stringify(references.map((r) => r.url)) : null,
        affected_products: affectedProducts,
      };

      try {
        saveCve(cveInput);
        stats.new++;
      } catch {
        // INSERT OR REPLACE handles duplicates
      }

      stats.total++;

      // Assess if this CVE warrants a user-facing alert
      if (cvss.score !== null) {
        const relevance = assessAlertRelevance(
          cve.id,
          cvss.score,
          description,
          vendors,
          references
        );

        if (relevance) {
          stats.critical++;

          const alertDescription = [
            `📊 CVSS: ${cvss.score}/10 — ${(cvss.severity ?? "").toUpperCase()}`,
            relevance.reason,
            affectedProducts ? `🎯 Produits: ${truncateText(affectedProducts, 200)}` : null,
            description ? `📝 ${truncateText(description, 400)}` : null,
            `⚡ Action: Évaluer l'exposition et appliquer le correctif si disponible.`,
          ]
            .filter(Boolean)
            .join("\n");

          const alert: AlertInput = {
            type: relevance.alertType,
            title: `${cve.id} — CVSS ${cvss.score}${relevance.alertType === "cve_critical_exploited" ? " ⚠️ Exploitée activement" : ""}`,
            description: alertDescription,
            severity: relevance.priority,
            source_link: `https://nvd.nist.gov/vuln/detail/${cve.id}`,
            ref_id: cve.id, // Prevents duplicate alerts for the same CVE
          };

          saveAlert(alert);
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
