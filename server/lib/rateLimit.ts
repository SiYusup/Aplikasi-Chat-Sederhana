import NodeCache from 'node-cache';

// Counter rate-limit: 20 pesan/menit/user (R5). TTL 60 detik per key.
const counters = new NodeCache({ stdTTL: 60, checkperiod: 120 });

export const GLOBAL_RATE_LIMIT = 20;

export function checkRateLimit(clerkId: string): boolean {
  const key = `rl:${clerkId}`;
  const current = (counters.get<number>(key) ?? 0) + 1;
  counters.set(key, current);
  return current <= GLOBAL_RATE_LIMIT;
}

export function resetRateLimit(clerkId?: string): void {
  if (clerkId) counters.del(`rl:${clerkId}`);
  else counters.flushAll();
}

export default { checkRateLimit, resetRateLimit, GLOBAL_RATE_LIMIT };
