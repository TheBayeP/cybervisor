import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10) || 50));
    const offset = (page - 1) * limit;
    const startDate = searchParams.get("startDate") ?? undefined;
    const sort = searchParams.get("sort") ?? "date_desc";
    const typeFilter = searchParams.get("type") ?? undefined;

    const d = getDb();
    const orderDir = sort === "date_asc" ? "ASC" : "DESC";
    const dateCondition = startDate ? `AND date >= '${startDate}'` : "";

    // Build unified query from articles, cves, and alerts
    const queries: string[] = [];

    if (!typeFilter || typeFilter === "article") {
      queries.push(`
        SELECT id, 'article' as type, title, description, severity, link, source_id, category,
               NULL as cve_id, NULL as cvss_score, collected_at as date
        FROM articles
        WHERE 1=1 ${dateCondition.replace("date >=", "collected_at >=")}
      `);
    }

    if (!typeFilter || typeFilter === "cve") {
      queries.push(`
        SELECT id, 'cve' as type, 
               COALESCE(cve_id || ': ', '') || SUBSTR(description, 1, 200) as title,
               description, severity, NULL as link, NULL as source_id, NULL as category,
               cve_id, cvss_score, collected_at as date
        FROM cves
        WHERE 1=1 ${dateCondition.replace("date >=", "collected_at >=")}
      `);
    }

    if (!typeFilter || typeFilter === "alert") {
      queries.push(`
        SELECT id, 'alert' as type, title, description, severity, source_link as link,
               NULL as source_id, type as category, NULL as cve_id, NULL as cvss_score,
               created_at as date
        FROM alerts
        WHERE 1=1 ${dateCondition.replace("date >=", "created_at >=")}
      `);
    }

    if (queries.length === 0) {
      return NextResponse.json({ events: [] });
    }

    const unionQuery = queries.join(" UNION ALL ");
    const finalQuery = `SELECT * FROM (${unionQuery}) ORDER BY date ${orderDir} LIMIT ? OFFSET ?`;

    const events = d.prepare(finalQuery).all(limit, offset);

    return NextResponse.json({ events });
  } catch (error) {
    console.error("GET /api/watch error:", error);
    return NextResponse.json({ error: "Failed to fetch watch events" }, { status: 500 });
  }
}
