/**
 * LOCALSHORE — AUTOMATED REDIS CACHE & RATE-LIMITING VERIFICATION SUITE
 */

import { redisGet, redisSet, redisGetVersion, redisIncrementVersion, redisRateLimit, hashFilters } from "./redis.server.js";
import { buildCatalogCacheKey, normalizeSortOrder } from "./catalog.server.js";

export async function runRedisVerificationSuite() {
  console.log("\n=======================================================");
  console.log("  LOCALSHORE PRODUCTION REDIS SUITE RUNNER  ");
  console.log("=======================================================\n");

  let passes = 0;
  let fails = 0;

  // TEST 1: Filter Hashing Normalization
  try {
    const hash1 = hashFilters({ category: "Grocery ", sort: "PRICE" });
    const hash2 = hashFilters({ sort: "price", category: "grocery" });
    if (hash1 === hash2) {
      console.log("✔ TEST 1 PASSED: Deterministic filter hashing produces identical keys for equivalent queries.");
      passes++;
    } else {
      console.error(`❌ TEST 1 FAILED: Mismatch hash1=${hash1} vs hash2=${hash2}`);
      fails++;
    }
  } catch (err) {
    console.error("❌ TEST 1 FAILED with exception:", err);
    fails++;
  }

  // TEST 2: Redis SET & GET & TTL
  try {
    const testKey = "test:verification:item1";
    const testVal = { id: "p123", name: "Sample Item", price: 199 };
    await redisSet(testKey, testVal, 60);
    const retrieved = await redisGet<typeof testVal>(testKey);

    if (retrieved && retrieved.id === testVal.id && retrieved.price === testVal.price) {
      console.log("✔ TEST 2 PASSED: Redis SET/GET successfully persisted & retrieved structured JSON payload.");
      passes++;
    } else {
      console.error("❌ TEST 2 FAILED: Retrieved value did not match input payload.");
      fails++;
    }
  } catch (err) {
    console.error("❌ TEST 2 FAILED with exception:", err);
    fails++;
  }

  // TEST 3: Versioned Invalidation Namespace
  try {
    const v1Str = await redisGetVersion("version:test_products");
    const v1Num = Number(v1Str);
    await redisIncrementVersion("version:test_products");
    const v2Str = await redisGetVersion("version:test_products");
    const v2Num = Number(v2Str);

    if (v2Num > v1Num) {
      console.log(`✔ TEST 3 PASSED: Version namespace incremented successfully (v${v1Num} -> v${v2Num}).`);
      passes++;
    } else {
      console.error(`❌ TEST 3 FAILED: Version did not increment properly (v1=${v1Num}, v2=${v2Num}).`);
      fails++;
    }
  } catch (err) {
    console.error("❌ TEST 3 FAILED with exception:", err);
    fails++;
  }

  // TEST 4: Rate Limiting Enforcement
  try {
    const testIp = `test-ip-${Date.now()}`;
    const r1 = await redisRateLimit(`test:${testIp}`, 2, 60);
    const r2 = await redisRateLimit(`test:${testIp}`, 2, 60);
    const r3 = await redisRateLimit(`test:${testIp}`, 2, 60);

    if (r1.allowed && r2.allowed && !r3.allowed) {
      console.log("✔ TEST 4 PASSED: Rate limit correctly allowed 2 requests and rejected 3rd request.");
      passes++;
    } else {
      console.error(`❌ TEST 4 FAILED: Rate limit response unexpected: r1=${r1.allowed}, r2=${r2.allowed}, r3=${r3.allowed}`);
      fails++;
    }
  } catch (err) {
    console.error("❌ TEST 4 FAILED with exception:", err);
    fails++;
  }

  // TEST 5: Sort & Pagination Cache Key Generation
  try {
    const keyA = buildCatalogCacheKey({
      prefix: "products",
      version: "1",
      locBucket: "global",
      category: "Grocery",
      sort: "price asc",
      page: 1,
      limit: 20,
      filterHash: "f_123",
    });

    const keyB = buildCatalogCacheKey({
      prefix: "products",
      version: "1",
      locBucket: "global",
      category: "grocery",
      sort: "price_asc",
      page: 1,
      limit: 20,
      filterHash: "f_123",
    });

    const keyC_page2 = buildCatalogCacheKey({
      prefix: "products",
      version: "1",
      locBucket: "global",
      category: "grocery",
      sort: "price_asc",
      page: 2,
      limit: 20,
      filterHash: "f_123",
    });

    const keyD_sortRating = buildCatalogCacheKey({
      prefix: "products",
      version: "1",
      locBucket: "global",
      category: "grocery",
      sort: "rating",
      page: 1,
      limit: 20,
      filterHash: "f_123",
    });

    const isIdentical = keyA === keyB;
    const isDistinctPage = keyA !== keyC_page2;
    const isDistinctSort = keyA !== keyD_sortRating;

    if (isIdentical && isDistinctPage && isDistinctSort) {
      console.log(`✔ TEST 5 PASSED: Sort & Pagination Cache Keys are deterministic & collision-free (${keyA}).`);
      passes++;
    } else {
      console.error(`❌ TEST 5 FAILED: keyA=${keyA}, keyB=${keyB}, keyC=${keyC_page2}, keyD=${keyD_sortRating}`);
      fails++;
    }
  } catch (err) {
    console.error("❌ TEST 5 FAILED with exception:", err);
    fails++;
  }

  console.log("\n-------------------------------------------------------");
  console.log(`TEST SUMMARY: ${passes} Passed, ${fails} Failed.`);
  console.log("-------------------------------------------------------\n");

  return { passes, fails };
}

// Execute if run directly via tsx / node
if (process.argv[1]?.endsWith("redis-verification.test.ts")) {
  runRedisVerificationSuite().then(({ fails }) => {
    if (fails > 0) process.exit(1);
  });
}
