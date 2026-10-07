const CATALOG_RPC_TIMEOUT_MS = 12_000;

/** Retry only failures that can recover without changing the request. */
export function shouldRetryCatalogQuery(failureCount: number, error: unknown) {
  if (failureCount >= 2) return false;
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /timed?\s*out|timeout|connection|network|fetch|temporar|statement/i.test(message);
}

type CatalogRpcResponse = {
  data: unknown;
  error: { code?: string; message?: string } | null;
};

type CatalogRpcRequest = PromiseLike<CatalogRpcResponse> & {
  abortSignal?: (signal: AbortSignal) => PromiseLike<CatalogRpcResponse>;
};

/**
 * Bound customer catalog requests so a stalled API cannot leave search and
 * nearby-card skeletons on screen forever. Supabase PostgREST builders support
 * abortSignal; the race also protects callers if a future adapter does not.
 */
export async function runCatalogRpcWithTimeout(
  request: CatalogRpcRequest,
  timeoutMs = CATALOG_RPC_TIMEOUT_MS,
): Promise<CatalogRpcResponse> {
  const timeoutError = new Error("Catalog request timed out. Please retry.");
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(timeoutError), timeoutMs);
  });

  try {
    const boundedRequest =
      typeof request.abortSignal === "function" &&
      typeof AbortSignal !== "undefined" &&
      typeof AbortSignal.timeout === "function"
        ? request.abortSignal(AbortSignal.timeout(timeoutMs))
        : request;
    return await Promise.race([Promise.resolve(boundedRequest), timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
