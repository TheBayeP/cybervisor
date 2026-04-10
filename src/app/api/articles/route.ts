import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20));
    const offset = (page - 1) * limit;

    const category = searchParams.get("category") ?? undefined;
    const severity = searchParams.get("severity") ?? undefined;
    const source = searchParams.get("source") ?? undefined;
    const country = searchParams.get("country") ?? undefined;
    const search = searchParams.get("search") ?? undefined;
    const startDate = searchParams.get("startDate") ?? undefined;
    const endDate = searchParams.get("endDate") ?? undefined;
    const sort = searchParams.get("sort") ?? undefined;

    // Multi-value filters for tab-based filtering
    const sourceIdsParam = searchParams.get("sourceIds");
    const sourceIds = sourceIdsParam ? sourceIdsParam.split(",").filter(Boolean) : undefined;

    const severitiesParam = searchParams.get("severities");
    const severities = severitiesParam ? severitiesParam.split(",").filter(Boolean) : undefined;

    // Validate severity if provided (single value)
    const validSeverities = ["critical", "high", "medium", "low", "info"];
    if (severity && !validSeverities.includes(severity)) {
      return NextResponse.json(
        { error: `Invalid severity. Must be one of: ${validSeverities.join(", ")}` },
        { status: 400 }
      );
    }

    // Build SQL query manually to support multi-value source/severity filters
    const d = getDb();
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (category) { conditions.push("category = ?"); params.push(category); }
    if (severity) { conditions.push("severity = ?"); params.push(severity); }
    if (severities && severities.length > 0) {
      conditions.push(`severity IN (${severities.map(() => "?").join(",")})`);
      params.push(...severities);
    }
    if (source) { conditions.push("source_id = ?"); params.push(source); }
    if (sourceIds && sourceIds.length > 0) {
      conditions.push(`source_id IN (${sourceIds.map(() => "?").join(",")})`);
      params.push(...sourceIds);
    }
    if (country) { conditions.push("country = ?"); params.push(country); }
    if (startDate) { conditions.push("COALESCE(pub_date, collected_at) >= ?"); params.push(startDate); }
    if (endDate) { conditions.push("COALESCE(pub_date, collected_at) <= ?"); params.push(endDate); }
    if (search) {
      conditions.push("(title LIKE ? OR description LIKE ?)");
      const term = `%${search}%`;
      params.push(term, term);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Sort: always prefer pub_date over collected_at for chronological accuracy
    let orderBy = "COALESCE(pub_date, collected_at) DESC";
    if (sort === "date_asc") orderBy = "COALESCE(pub_date, collected_at) ASC";
    else if (sort === "severity_desc") orderBy = "CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END ASC, COALESCE(pub_date, collected_at) DESC";
    else if (sort === "severity_asc") orderBy = "CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END DESC, COALESCE(pub_date, collected_at) ASC";

    const articles = d.prepare(
      `SELECT * FROM articles ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`
    ).all(...params, limit, offset);

    // Count for pagination (reuse same conditions)
    const countRow = d.prepare(
      `SELECT COUNT(*) as count FROM articles ${where}`
    ).get(...params) as { count: number } | undefined;
    const total = countRow?.count ?? 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      articles,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    console.error("GET /api/articles error:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}
