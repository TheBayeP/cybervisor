import { NextRequest, NextResponse } from "next/server";
import { sources } from "@/lib/sources";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const category = searchParams.get("category");
    const country = searchParams.get("country");

    let filtered = sources;

    if (category) {
      filtered = filtered.filter((s) => s.category === category);
    }

    if (country) {
      filtered = filtered.filter(
        (s) => s.country.toLowerCase() === country.toLowerCase()
      );
    }

    return NextResponse.json({
      sources: filtered,
      total: filtered.length,
    });
  } catch (error) {
    console.error("GET /api/sources error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sources" },
      { status: 500 }
    );
  }
}
