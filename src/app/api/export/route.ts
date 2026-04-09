import { NextRequest, NextResponse } from "next/server";
import { getArticles, getCves, getAlerts, type ArticleFilters, type CveFilters, type AlertFilters } from "@/lib/db";

function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // Escape fields containing commas, quotes, or newlines
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const headerLine = headers.map(escapeCsvField).join(",");
  const dataLines = rows.map((row) =>
    headers.map((h) => escapeCsvField(row[h])).join(",")
  );
  return [headerLine, ...dataLines].join("\n");
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const type = searchParams.get("type");
    const format = searchParams.get("format") ?? "csv";

    // Validate type
    const validTypes = ["articles", "cves", "alerts"];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        { error: `type is required and must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    if (format !== "csv") {
      return NextResponse.json(
        { error: "Only csv format is currently supported" },
        { status: 400 }
      );
    }

    // Use a large limit for exports
    const exportLimit = 10000;
    let rows: Record<string, unknown>[] = [];
    let filename = "";

    switch (type) {
      case "articles": {
        const filters: ArticleFilters = {
          category: searchParams.get("category") ?? undefined,
          severity: searchParams.get("severity") ?? undefined,
          source_id: searchParams.get("source") ?? undefined,
          country: searchParams.get("country") ?? undefined,
          search: searchParams.get("search") ?? undefined,
          since: searchParams.get("startDate") ?? undefined,
          limit: exportLimit,
          offset: 0,
        };
        rows = getArticles(filters) as unknown as Record<string, unknown>[];
        filename = "cybervisor-articles.csv";
        break;
      }
      case "cves": {
        const filters: CveFilters = {
          severity: searchParams.get("severity") ?? undefined,
          search: searchParams.get("search") ?? undefined,
          min_cvss: searchParams.get("minScore") ? parseFloat(searchParams.get("minScore")!) : undefined,
          limit: exportLimit,
          offset: 0,
        };
        rows = getCves(filters) as unknown as Record<string, unknown>[];

        const maxScore = searchParams.get("maxScore") ? parseFloat(searchParams.get("maxScore")!) : undefined;
        if (maxScore !== undefined) {
          rows = rows.filter((r) => ((r as { cvss_score?: number }).cvss_score ?? 0) <= maxScore);
        }
        filename = "cybervisor-cves.csv";
        break;
      }
      case "alerts": {
        const acknowledgedParam = searchParams.get("acknowledged");
        let acknowledged: number | undefined;
        if (acknowledgedParam === "true" || acknowledgedParam === "1") acknowledged = 1;
        else if (acknowledgedParam === "false" || acknowledgedParam === "0") acknowledged = 0;

        const filters: AlertFilters = {
          severity: searchParams.get("severity") ?? undefined,
          acknowledged,
          limit: exportLimit,
          offset: 0,
        };
        rows = getAlerts(filters) as unknown as Record<string, unknown>[];
        filename = "cybervisor-alerts.csv";
        break;
      }
    }

    const csv = toCsv(rows);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("GET /api/export error:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
