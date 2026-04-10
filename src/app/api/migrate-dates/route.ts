import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

/**
 * POST /api/migrate-dates
 * One-time migration: normalizes pub_date values stored in RFC 2822 format
 * (e.g. "Thu, 10 Apr 2026 15:30:00 +0000") to ISO 8601
 * (e.g. "2026-04-10T15:30:00.000Z") so SQLite can sort them correctly.
 */
export async function POST() {
  try {
    const db = getDb();

    // Fetch all articles with non-null pub_date that are NOT already ISO 8601.
    // ISO 8601 starts with YYYY- (4 digits followed by a dash).
    const rows = db
      .prepare(
        `SELECT id, pub_date FROM articles
         WHERE pub_date IS NOT NULL
           AND pub_date NOT LIKE '____-__-__%'`
      )
      .all() as { id: number; pub_date: string }[];

    if (rows.length === 0) {
      return NextResponse.json({ message: "No dates to migrate", updated: 0 });
    }

    const update = db.prepare("UPDATE articles SET pub_date = ? WHERE id = ?");

    let updated = 0;
    let skipped = 0;

    const tx = db.transaction(() => {
      for (const row of rows) {
        const parsed = new Date(row.pub_date);
        if (!isNaN(parsed.getTime())) {
          update.run(parsed.toISOString(), row.id);
          updated++;
        } else {
          // Unparseable — set to NULL so we fall back to collected_at
          update.run(null, row.id);
          skipped++;
        }
      }
    });

    tx();

    return NextResponse.json({
      message: `Migration complete`,
      found: rows.length,
      updated,
      nullified: skipped,
    });
  } catch (error) {
    console.error("POST /api/migrate-dates error:", error);
    return NextResponse.json(
      { error: "Migration failed", detail: String(error) },
      { status: 500 }
    );
  }
}
