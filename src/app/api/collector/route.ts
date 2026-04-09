import { NextResponse } from "next/server";
import { collectAllFeeds } from "@/lib/collector/feedCollector";

export async function POST() {
  try {
    const stats = await collectAllFeeds();

    return NextResponse.json({
      message: "Feed collection completed",
      stats,
    });
  } catch (error) {
    console.error("POST /api/collector error:", error);
    return NextResponse.json(
      { error: "Failed to collect feeds" },
      { status: 500 }
    );
  }
}
