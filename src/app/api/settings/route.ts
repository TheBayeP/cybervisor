import { NextRequest, NextResponse } from "next/server";
import { getDb, setSetting } from "@/lib/db";

/** Setting keys that contain sensitive data -- values are masked in GET responses */
const SENSITIVE_KEYS = [
  "smtp_password",
  "api_key",
  "openai_api_key",
  "anthropic_api_key",
  "gemini_api_key",
  "webhook_secret",
  "email_password",
];

function isSensitive(key: string): boolean {
  const lower = key.toLowerCase();
  return SENSITIVE_KEYS.some((sk) => lower.includes(sk)) ||
    lower.includes("password") ||
    lower.includes("secret") ||
    lower.includes("api_key") ||
    lower.includes("apikey") ||
    lower.includes("token");
}

function maskValue(value: string): string {
  if (value.length <= 4) return "****";
  return value.slice(0, 2) + "*".repeat(Math.min(value.length - 4, 20)) + value.slice(-2);
}

export async function GET() {
  try {
    const d = getDb();
    const rows = d.prepare("SELECT key, value FROM settings ORDER BY key ASC").all() as Array<{ key: string; value: string | null }>;

    const settings: Record<string, string | null> = {};
    for (const row of rows) {
      settings[row.key] = row.value && isSensitive(row.key) ? maskValue(row.value) : row.value;
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || typeof key !== "string") {
      return NextResponse.json(
        { error: "key is required and must be a string" },
        { status: 400 }
      );
    }

    if (value === undefined || value === null) {
      return NextResponse.json(
        { error: "value is required" },
        { status: 400 }
      );
    }

    // Sanitize key: only allow alphanumeric, underscores, and dashes
    if (!/^[a-zA-Z0-9_-]+$/.test(key)) {
      return NextResponse.json(
        { error: "key may only contain letters, numbers, underscores, and dashes" },
        { status: 400 }
      );
    }

    setSetting(key, String(value));

    return NextResponse.json({
      message: "Setting updated successfully",
      key,
    });
  } catch (error) {
    console.error("POST /api/settings error:", error);
    return NextResponse.json(
      { error: "Failed to update setting" },
      { status: 500 }
    );
  }
}
