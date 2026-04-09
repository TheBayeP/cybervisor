import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const d = getDb();
    // Ensure table exists
    d.exec(`
      CREATE TABLE IF NOT EXISTS compliance_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        control_id TEXT UNIQUE NOT NULL,
        framework TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'not_evaluated',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const items = d.prepare("SELECT * FROM compliance_items").all();
    return NextResponse.json({ items });
  } catch (error) {
    console.error("GET /api/compliance error:", error);
    return NextResponse.json({ error: "Failed to fetch compliance data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { control_id, framework, status } = await request.json();

    if (!control_id || !framework || !status) {
      return NextResponse.json({ error: "control_id, framework, and status are required" }, { status: 400 });
    }

    const validStatuses = ["compliant", "in_progress", "non_compliant", "not_evaluated"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }, { status: 400 });
    }

    const d = getDb();
    // Ensure table exists
    d.exec(`
      CREATE TABLE IF NOT EXISTS compliance_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        control_id TEXT UNIQUE NOT NULL,
        framework TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'not_evaluated',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    d.prepare(
      `INSERT INTO compliance_items (control_id, framework, status, updated_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(control_id) DO UPDATE SET status = excluded.status, updated_at = CURRENT_TIMESTAMP`
    ).run(control_id, framework, status);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/compliance error:", error);
    return NextResponse.json({ error: "Failed to save compliance data" }, { status: 500 });
  }
}
