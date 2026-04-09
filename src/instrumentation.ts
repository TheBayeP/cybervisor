export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startScheduler } = await import('@/lib/collector/scheduler');
    const { startSynthesisScheduler } = await import('@/lib/synthesis/scheduler');

    console.log('[CyberVisor] Starting feed collector (every 5 min)...');
    startScheduler();

    console.log('[CyberVisor] Starting synthesis scheduler (8h & 14h)...');
    startSynthesisScheduler();
  }
}
