import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isSchedulerRunning } from "@/lib/collector/scheduler";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, { ok: boolean; detail?: string }> = {};

  // --- Database health ---
  try {
    const d = getDb();
    d.prepare("SELECT 1").get();
    const articleCount = (d.prepare("SELECT COUNT(*) as c FROM articles").get() as { c: number }).c;
    checks.database = { ok: true, detail: `${articleCount} articles` };
  } catch (e) {
    checks.database = { ok: false, detail: String(e) };
  }

  // --- WAL file size ---
  try {
    const walPath = path.resolve("./data/cybervisor.db-wal");
    if (fs.existsSync(walPath)) {
      const size = fs.statSync(walPath).size;
      const sizeMb = (size / 1024 / 1024).toFixed(1);
      checks.wal = { ok: size < 100 * 1024 * 1024, detail: `${sizeMb}MB` }; // warn if >100MB
    } else {
      checks.wal = { ok: true, detail: "no WAL file" };
    }
  } catch (e) {
    checks.wal = { ok: false, detail: String(e) };
  }

  // --- Memory ---
  const mem = process.memoryUsage();
  const rss = Math.round(mem.rss / 1024 / 1024);
  const heap = Math.round(mem.heapUsed / 1024 / 1024);
  checks.memory = {
    ok: rss < 800, // warn if RSS > 800MB
    detail: `RSS ${rss}MB, Heap ${heap}MB`,
  };

  // --- Scheduler ---
  checks.scheduler = {
    ok: isSchedulerRunning(),
    detail: isSchedulerRunning() ? "running" : "stopped",
  };

  const allOk = Object.values(checks).every((c) => c.ok);
  const status = allOk ? 200 : 503;

  return NextResponse.json(
    {
      status: allOk ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      checks,
    },
    { status }
  );
}
