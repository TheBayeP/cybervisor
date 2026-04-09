import { NextRequest, NextResponse } from "next/server";
import { getAlerts, acknowledgeAlert, getDb, type AlertFilters } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const severity = searchParams.get("severity") ?? undefined;
    const acknowledgedParam = searchParams.get("acknowledged");
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10) || 50));

    // Validate severity
    const validSeverities = ["critical", "high", "medium", "low"];
    if (severity && !validSeverities.includes(severity)) {
      return NextResponse.json(
        { error: `Invalid severity. Must be one of: ${validSeverities.join(", ")}` },
        { status: 400 }
      );
    }

    // Parse acknowledged: "true"/"1" -> 1, "false"/"0" -> 0, undefined -> skip
    let acknowledged: number | undefined;
    if (acknowledgedParam !== null) {
      if (acknowledgedParam === "true" || acknowledgedParam === "1") {
        acknowledged = 1;
      } else if (acknowledgedParam === "false" || acknowledgedParam === "0") {
        acknowledged = 0;
      } else {
        return NextResponse.json(
          { error: "acknowledged must be true/false or 1/0" },
          { status: 400 }
        );
      }
    }

    const filters: AlertFilters = {
      severity,
      acknowledged,
      limit,
    };

    const alerts = await getAlerts(filters);

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error("GET /api/alerts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id || typeof id !== "number") {
      return NextResponse.json(
        { error: "id is required and must be a number" },
        { status: 400 }
      );
    }

    // Verify the alert exists
    const d = await getDb();
    const result = d.exec("SELECT id FROM alerts WHERE id = ?", [id]);
    if (result.length === 0 || result[0].values.length === 0) {
      return NextResponse.json(
        { error: `Alert with id ${id} not found` },
        { status: 404 }
      );
    }

    await acknowledgeAlert(id);

    return NextResponse.json({
      message: "Alert acknowledged successfully",
      id,
    });
  } catch (error) {
    console.error("PATCH /api/alerts error:", error);
    return NextResponse.json(
      { error: "Failed to acknowledge alert" },
      { status: 500 }
    );
  }
}
