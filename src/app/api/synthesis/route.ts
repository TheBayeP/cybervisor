import { NextRequest, NextResponse } from "next/server";
import { getSyntheses } from "@/lib/db";
import { generateSynthesis } from "@/lib/synthesis";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10) || 10));

    const syntheses = getSyntheses(limit);

    return NextResponse.json({ syntheses });
  } catch (error) {
    console.error("GET /api/synthesis error:", error);
    return NextResponse.json(
      { error: "Failed to fetch syntheses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { timeSlot } = body;

    // Validate timeSlot
    const validTimeSlots = ["08:00", "14:00"];
    if (!timeSlot || !validTimeSlots.includes(timeSlot)) {
      return NextResponse.json(
        { error: `Invalid timeSlot. Must be one of: ${validTimeSlots.join(", ")}` },
        { status: 400 }
      );
    }

    const synthesis = await generateSynthesis(timeSlot);

    return NextResponse.json({
      message: "Synthesis generated successfully",
      synthesis,
    });
  } catch (error) {
    console.error("POST /api/synthesis error:", error);
    return NextResponse.json(
      { error: "Failed to generate synthesis" },
      { status: 500 }
    );
  }
}
