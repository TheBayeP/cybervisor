import { NextRequest, NextResponse } from "next/server";
import { getArticles, getDb, type ArticleFilters } from "@/lib/db";

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

    // Validate severity if provided
    const validSeverities = ["critical", "high", "medium", "low"];
    if (severity && !validSeverities.includes(severity)) {
      return NextResponse.json(
        { error: `Invalid severity. Must be one of: ${validSeverities.join(", ")}` },
        { status: 400 }
      );
    }

    const filters: ArticleFilters = {
      category,
      severity,
      source_id: source,
      country,
      search,
      since: startDate,
      limit,
      offset,
    };

    const articles = await getArticles(filters);

    // Count total matching articles for pagination
    const d = await getDb();
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (category) { conditions.push("category = ?"); params.push(category); }
    if (severity) { conditions.push("severity = ?"); params.push(severity); }
    if (source) { conditions.push("source_id = ?"); params.push(source); }
    if (country) { conditions.push("country = ?"); params.push(country); }
    if (startDate) { conditions.push("collected_at >= ?"); params.push(startDate); }
    if (endDate) { conditions.push("collected_at <= ?"); params.push(endDate); }
    if (search) {
      conditions.push("(title LIKE ? OR description LIKE ?)");
      const term = `%${search}%`;
      params.push(term, term);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const countResult = d.exec(`SELECT COUNT(*) as count FROM articles ${where}`, params);
    const total = countResult.length > 0 ? (countResult[0].values[0][0] as number) : 0;
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
