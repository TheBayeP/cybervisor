import cron, { type ScheduledTask } from "node-cron";
import { collectAllFeeds } from "./feedCollector";
import { collectRecentCves } from "./cveCollector";
import { purgeOldData } from "../db";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let feedTask: ScheduledTask | null = null;
let cveTask: ScheduledTask | null = null;
let purgeTask: ScheduledTask | null = null;
let running = false;

// Mutex flags to prevent overlapping runs
let feedRunning = false;
let cveRunning = false;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timestamp(): string {
  return new Date().toISOString();
}

async function runFeedCollection(): Promise<void> {
  if (feedRunning) {
    console.log(`[${timestamp()}] [Scheduler] Feed collection skipped (previous run still active)`);
    return;
  }
  feedRunning = true;
  console.log(`[${timestamp()}] [Scheduler] Starting feed collection...`);
  const start = Date.now();

  try {
    const stats = await collectAllFeeds();
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(
      `[${timestamp()}] [Scheduler] Feed collection complete in ${elapsed}s ` +
        `- Total: ${stats.total}, New: ${stats.new}, Errors: ${stats.errors}`
    );

    if (stats.errors > 0) {
      const failedSources = Object.entries(stats.bySource)
        .filter(([, v]) => v.error)
        .map(([id, v]) => `  ${id}: ${v.error}`)
        .join("\n");
      console.warn(
        `[${timestamp()}] [Scheduler] Failed sources:\n${failedSources}`
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[${timestamp()}] [Scheduler] Feed collection failed: ${msg}`);
  } finally {
    feedRunning = false;
  }
}

async function runCveCollection(): Promise<void> {
  if (cveRunning) {
    console.log(`[${timestamp()}] [Scheduler] CVE collection skipped (previous run still active)`);
    return;
  }
  cveRunning = true;
  console.log(`[${timestamp()}] [Scheduler] Starting CVE collection...`);
  const start = Date.now();

  try {
    const stats = await collectRecentCves(6);
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(
      `[${timestamp()}] [Scheduler] CVE collection complete in ${elapsed}s ` +
        `- Total: ${stats.total}, New: ${stats.new}, Critical: ${stats.critical}`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[${timestamp()}] [Scheduler] CVE collection failed: ${msg}`);
  } finally {
    cveRunning = false;
  }
}

function runPurge(): void {
  console.log(`[${timestamp()}] [Scheduler] Running data purge...`);
  try {
    const stats = purgeOldData(90, 180, 30);
    console.log(
      `[${timestamp()}] [Scheduler] Purge complete ` +
        `- Articles: ${stats.articles}, CVEs: ${stats.cves}, Alerts: ${stats.alerts}`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[${timestamp()}] [Scheduler] Purge failed: ${msg}`);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function startScheduler(): void {
  if (running) {
    console.warn(`[${timestamp()}] [Scheduler] Already running, ignoring start request`);
    return;
  }

  console.log(`[${timestamp()}] [Scheduler] Starting scheduler...`);
  console.log(`[${timestamp()}] [Scheduler]   Feed collection: every 15 minutes`);
  console.log(`[${timestamp()}] [Scheduler]   CVE collection:  every 30 minutes`);
  console.log(`[${timestamp()}] [Scheduler]   Data purge:      daily at 03:00`);

  // Schedule feed collection every 15 minutes (was 5min, reduced for RAM)
  feedTask = cron.schedule("*/15 * * * *", () => {
    void runFeedCollection();
  });

  // Schedule CVE collection every 30 minutes
  cveTask = cron.schedule("*/30 * * * *", () => {
    void runCveCollection();
  });

  // Schedule daily data purge at 03:00 to clean old records
  purgeTask = cron.schedule("0 3 * * *", () => {
    runPurge();
  });

  running = true;

  // Run initial collection after a short delay (let Next.js boot first)
  setTimeout(() => {
    console.log(`[${timestamp()}] [Scheduler] Running initial collection...`);
    void runFeedCollection();
    void runCveCollection();
  }, 5000);
}

export function stopScheduler(): void {
  if (!running) {
    console.warn(`[${timestamp()}] [Scheduler] Not running, ignoring stop request`);
    return;
  }

  console.log(`[${timestamp()}] [Scheduler] Stopping scheduler...`);

  if (feedTask) {
    feedTask.stop();
    feedTask = null;
  }

  if (cveTask) {
    cveTask.stop();
    cveTask = null;
  }

  if (purgeTask) {
    purgeTask.stop();
    purgeTask = null;
  }

  running = false;
  console.log(`[${timestamp()}] [Scheduler] Stopped`);
}

export function isSchedulerRunning(): boolean {
  return running;
}
