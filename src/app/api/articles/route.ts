import { NextRequest, NextResponse } from "next/server";
import { getArticles, getArticleCount, type ArticleFilters } from "@/lib/db";

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

    const articles = getArticles(filters);

    // Count total matching articles for pagination
    const total = getArticleCount({
      category,
      severity,
      source_id: source,
      country,
      since: startDate,
      endDate,
      search,
    });
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
