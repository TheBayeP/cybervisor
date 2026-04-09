import cron, { type ScheduledTask } from "node-cron";
import { collectAllFeeds } from "./feedCollector";
import { collectRecentCves } from "./cveCollector";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let feedTask: ScheduledTask | null = null;
let cveTask: ScheduledTask | null = null;
let running = false;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timestamp(): string {
  return new Date().toISOString();
}

async function runFeedCollection(): Promise<void> {
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
  }
}

async function runCveCollection(): Promise<void> {
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
  console.log(`[${timestamp()}] [Scheduler]   Feed collection: every 5 minutes`);
  console.log(`[${timestamp()}] [Scheduler]   CVE collection:  every 30 minutes`);

  // Schedule feed collection every 5 minutes
  feedTask = cron.schedule("*/5 * * * *", () => {
    void runFeedCollection();
  });

  // Schedule CVE collection every 30 minutes
  cveTask = cron.schedule("*/30 * * * *", () => {
    void runCveCollection();
  });

  running = true;

  // Run both immediately on start
  console.log(`[${timestamp()}] [Scheduler] Running initial collection...`);
  void runFeedCollection();
  void runCveCollection();
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

  running = false;
  console.log(`[${timestamp()}] [Scheduler] Stopped`);
}

export function isSchedulerRunning(): boolean {
  return running;
}
