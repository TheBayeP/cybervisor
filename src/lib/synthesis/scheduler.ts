import cron, { type ScheduledTask } from "node-cron";
import { generateSynthesis, type TimeSlot } from "./generator";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let morningTask: ScheduledTask | null = null;
let afternoonTask: ScheduledTask | null = null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timestamp(): string {
  return new Date().toISOString();
}

async function runSynthesis(timeSlot: TimeSlot): Promise<void> {
  console.log(`[${timestamp()}] [synthesis-scheduler] Starting ${timeSlot} synthesis...`);
  try {
    const result = await generateSynthesis(timeSlot);
    console.log(
      `[${timestamp()}] [synthesis-scheduler] ${timeSlot} synthesis complete ` +
        `(${result.articles_count} articles, ${result.cves_count} CVEs, ${result.critical_count} critical)`
    );
  } catch (error) {
    console.error(
      `[${timestamp()}] [synthesis-scheduler] ${timeSlot} synthesis failed:`,
      error instanceof Error ? error.message : error
    );
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Start the synthesis scheduler.
 * Runs briefs at 08:00 and 14:00 server-local time every day.
 */
export function startSynthesisScheduler(): void {
  if (morningTask || afternoonTask) {
    console.warn(
      `[${timestamp()}] [synthesis-scheduler] Scheduler is already running.`
    );
    return;
  }

  // Every day at 08:00
  morningTask = cron.schedule("0 8 * * *", () => {
    void runSynthesis("08:00");
  });

  // Every day at 14:00
  afternoonTask = cron.schedule("0 14 * * *", () => {
    void runSynthesis("14:00");
  });

  console.log(
    `[${timestamp()}] [synthesis-scheduler] Scheduler started (08:00 & 14:00 daily).`
  );
}

/**
 * Stop the synthesis scheduler and release cron tasks.
 */
export function stopSynthesisScheduler(): void {
  if (morningTask) {
    morningTask.stop();
    morningTask = null;
  }
  if (afternoonTask) {
    afternoonTask.stop();
    afternoonTask = null;
  }

  console.log(`[${timestamp()}] [synthesis-scheduler] Scheduler stopped.`);
}
