import { NextRequest, NextResponse } from "next/server";
import { getCves, getDb, type CveFilters } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20));
    const offset = (page - 1) * limit;

    const severity = searchParams.get("severity") ?? undefined;
    const search = searchParams.get("search") ?? undefined;
    const minScoreStr = searchParams.get("minScore");
    const maxScoreStr = searchParams.get("maxScore");

    // Validate severity
    const validSeverities = ["critical", "high", "medium", "low"];
    if (severity && !validSeverities.includes(severity)) {
      return NextResponse.json(
        { error: `Invalid severity. Must be one of: ${validSeverities.join(", ")}` },
        { status: 400 }
      );
    }

    // Parse and validate CVSS score range
    const minScore = minScoreStr ? parseFloat(minScoreStr) : undefined;
    const maxScore = maxScoreStr ? parseFloat(maxScoreStr) : undefined;

    if (minScore !== undefined && (isNaN(minScore) || minScore < 0 || minScore > 10)) {
      return NextResponse.json(
        { error: "minScore must be a number between 0 and 10" },
        { status: 400 }
      );
    }
    if (maxScore !== undefined && (isNaN(maxScore) || maxScore < 0 || maxScore > 10)) {
      return NextResponse.json(
        { error: "maxScore must be a number between 0 and 10" },
        { status: 400 }
      );
    }

    const filters: CveFilters = {
      severity,
      search,
      min_cvss: minScore,
      limit,
      offset,
    };

    const cves = await getCves(filters);

    // Filter by maxScore in-memory since the db module only supports min_cvss
    const filteredCves = maxScore !== undefined
      ? cves.filter((cve) => (cve.cvss_score ?? 0) <= maxScore)
      : cves;

    // Count total matching CVEs for pagination
    const d = await getDb();
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (severity) { conditions.push("severity = ?"); params.push(severity); }
    if (minScore !== undefined) { conditions.push("cvss_score >= ?"); params.push(minScore); }
    if (maxScore !== undefined) { conditions.push("cvss_score <= ?"); params.push(maxScore); }
    if (search) {
      conditions.push("(cve_id LIKE ? OR description LIKE ? OR affected_products LIKE ?)");
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const countResult = d.exec(`SELECT COUNT(*) as count FROM cves ${where}`, params);
    const total = countResult.length > 0 ? (countResult[0].values[0][0] as number) : 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      cves: filteredCves,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    console.error("GET /api/cves error:", error);
    return NextResponse.json(
      { error: "Failed to fetch CVEs" },
      { status: 500 }
    );
  }
}
