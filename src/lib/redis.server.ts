/**
 * LOCALSHORE — CENTRALIZED SERVER-ONLY REDIS UTILITY
 *
 * CRITICAL SECURITY CONSTRAINTS:
 * 1. MUST NEVER BE IMPORTED IN CLIENT/BROWSER CODE.
 * 2. USES SERVER-SIDE `REDIS_URL` ENVIRONMENT VARIABLE ONLY.
 * 3. EXPOSES NO CREDENTIALS TO CLIENT BUNDLES OR LOGS.
 * 4. ALL OPERATIONS FAIL SAFELY WITHOUT CRASHING PUBLIC BROWSING.
 */

if (typeof window !== "undefined") {
  throw new Error("SECURITY ERROR: redis.server.ts must only be imported in server-side code!");
}

import Redis from "ioredis";

// Singleton Redis Client Instance
let redisInstance: Redis | null = null;

function getRedisClient(): Redis | null {
  if (redisInstance) return redisInstance;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.warn("[Redis Server] REDIS_URL not configured in environment. Operating in direct Supabase mode.");
    return null;
  }

  try {
    redisInstance = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
      showFriendlyErrorStack: false,
    });

    redisInstance.on("error", (err) => {
      console.error("[Redis Server] Client connection notice:", {
        op: "connect",
        status: "FALLBACK_SUPABASE",
        error: err?.message || String(err),
      });
    });

    return redisInstance;
  } catch (err: any) {
    console.error("[Redis Server] Failed to initialize client:", {
      op: "init",
      status: "FALLBACK_SUPABASE",
      error: err?.message || String(err),
    });
    return null;
  }
}

/**
 * Deterministic Filter Normalizer & Hash
 */
export function hashFilters(filters: Record<string, any>): string {
  try {
    const keys = Object.keys(filters).sort();
    const normalized: Record<string, any> = {};
    for (const key of keys) {
      const val = filters[key];
      if (val !== undefined && val !== null && val !== "") {
        if (typeof val === "string") {
          normalized[key] = val.trim().toLowerCase();
        } else {
          normalized[key] = val;
        }
      }
    }
    const str = JSON.stringify(normalized);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return `f_${Math.abs(hash).toString(36)}`;
  } catch {
    return "f_default";
  }
}

/**
 * Safe Typed Redis GET with Error Fallback
 */
export async function redisGet<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) return null;

  try {
    const raw = await client.get(key);
    if (raw !== null && raw !== undefined) {
      console.log(`[Redis Server] op=GET key="${key}" status=CACHE_HIT`);
      return JSON.parse(raw) as T;
    }
    console.log(`[Redis Server] op=GET key="${key}" status=CACHE_MISS`);
    return null;
  } catch (err: any) {
    console.error(`[Redis Server] op=GET key="${key}" status=FALLBACK_SUPABASE error="${err?.message || String(err)}"`);
    return null;
  }
}

/**
 * Safe Typed Redis SET with TTL (in seconds)
 */
export async function redisSet<T>(key: string, value: T, ttlSeconds: number = 180): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;

  try {
    const serialized = JSON.stringify(value);
    await client.set(key, serialized, "EX", ttlSeconds);
    console.log(`[Redis Server] op=SET key="${key}" ttl=${ttlSeconds}s payloadSize=${serialized.length}B status=OK`);
    return true;
  } catch (err: any) {
    console.error(`[Redis Server] op=SET key="${key}" status=FALLBACK_SUPABASE error="${err?.message || String(err)}"`);
    return false;
  }
}

/**
 * Safe Version Retrieval for Namespaces
 */
export async function redisGetVersion(versionKey: string): Promise<string> {
  const ver = await redisGet<string>(versionKey);
  return ver || "0";
}

/**
 * Safe Version Increment for Targeted Invalidation
 */
export async function redisIncrementVersion(versionKey: string): Promise<string> {
  const client = getRedisClient();
  if (!client) return "1";

  try {
    const newVer = await client.incr(versionKey);
    console.log(`[Redis Server] op=INCR key="${versionKey}" newVersion=${newVer} status=OK`);
    return String(newVer);
  } catch (err: any) {
    console.error(`[Redis Server] op=INCR key="${versionKey}" status=FALLBACK error="${err?.message || String(err)}"`);
    return "1";
  }
}

/**
 * Safe Rate Limiting Helper (Fixed Window)
 */
export async function redisRateLimit(
  identifierKey: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  const client = getRedisClient();
  if (!client) {
    return { allowed: true, remaining: limit };
  }

  try {
    const key = `ratelimit:${identifierKey}`;
    const current = await client.incr(key);
    if (current === 1) {
      await client.expire(key, windowSeconds);
    }
    const allowed = current <= limit;
    const remaining = Math.max(0, limit - current);
    if (!allowed) {
      console.warn(`[Redis Server] op=RATELIMIT key="${key}" current=${current} limit=${limit} status=REJECTED`);
    }
    return { allowed, remaining };
  } catch (err: any) {
    console.error(`[Redis Server] op=RATELIMIT key="${identifierKey}" status=FALLBACK error="${err?.message || String(err)}"`);
    return { allowed: true, remaining: limit };
  }
}
