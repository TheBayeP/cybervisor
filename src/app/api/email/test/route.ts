import { NextRequest, NextResponse } from "next/server";
import { testEmailConnection } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "email is required and must be a string" },
        { status: 400 }
      );
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const result = await testEmailConnection();

    return NextResponse.json({
      message: "Test email sent successfully",
      result,
    });
  } catch (error) {
    console.error("POST /api/email/test error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to send test email", details: errorMessage },
      { status: 500 }
    );
  }
}
