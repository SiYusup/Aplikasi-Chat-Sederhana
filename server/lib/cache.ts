import NodeCache from 'node-cache';

// Singleton cache in-memory (pengganti Redis — Tech Spec §Caching).
// Dipakai: daftar room global (TTL 60 detik). Hilang saat restart (cukup untuk demo).
export const roomCache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

export default roomCache;
