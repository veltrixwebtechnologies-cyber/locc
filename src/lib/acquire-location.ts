import {
  parseCoordinates,
  usableGPS,
  MAX_LOCATION_AGE_MS,
  MAX_NAVIGATION_ACCURACY_M,
} from "./coordinates";

export type LocationFailure = "denied" | "unavailable" | "timeout" | "unsupported" | "error";

export class LocationAcquisitionError extends Error {
  constructor(
    message: string,
    public status: LocationFailure,
  ) {
    super(message);
    this.name = "LocationAcquisitionError";
  }
}

export function freshBrowserPosition(position: GeolocationPosition, now = Date.now()): boolean {
  return (
    !!parseCoordinates(position.coords.latitude, position.coords.longitude) &&
    Number.isFinite(position.coords.accuracy) &&
    position.coords.accuracy >= 0 &&
    Number.isFinite(position.timestamp) &&
    now - position.timestamp <= MAX_LOCATION_AGE_MS &&
    position.timestamp <= now + 1000
  );
}

export function accuracyLabel(metres: number): string {
  return metres < 1000 ? `${Math.ceil(metres)} m` : `${(metres / 1000).toFixed(1)} km`;
}

/** Wait for an improving fix, with a deadline independent of browser callbacks/permission prompts. */
export function acquireCurrentPosition(
  options: {
    signal?: AbortSignal;
    timeoutMs?: number;
    onProgress?: (message: string) => void;
  } = {},
): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    const { signal, onProgress, timeoutMs = 20_000 } = options;
    if (signal?.aborted)
      return reject(new DOMException("Location request cancelled.", "AbortError"));
    if (typeof window === "undefined" || !navigator.geolocation) {
      return reject(
        new LocationAcquisitionError(
          "This browser does not support location. Search for your area below.",
          "unsupported",
        ),
      );
    }
    if (!window.isSecureContext) {
      return reject(
        new LocationAcquisitionError(
          "Location requires HTTPS. Open the secure deployed site and try again.",
          "error",
        ),
      );
    }

    let watchId: number | undefined;
    let settled = false;
    let best: GeolocationPosition | undefined;
    let lastError: GeolocationPositionError | undefined;
    const cleanup = () => {
      clearTimeout(deadline);
      signal?.removeEventListener("abort", abort);
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
    };
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };
    const abort = () => fail(new DOMException("Location request cancelled.", "AbortError"));
    const deadline = setTimeout(() => {
      if (best && freshBrowserPosition(best)) {
        fail(
          new LocationAcquisitionError(
            `Your browser supplied an approximate location (±${accuracyLabel(best.coords.accuracy)}). Waiting did not produce the required ${MAX_NAVIGATION_ACCURACY_M} m accuracy. Enable precise location and retry, or choose your destination manually.`,
            "unavailable",
          ),
        );
      } else if (lastError?.code === 2) {
        fail(
          new LocationAcquisitionError(
            "Your browser could not determine your location. Check device location services, retry, or search for your area below.",
            "unavailable",
          ),
        );
      } else {
        fail(
          new LocationAcquisitionError(
            "Location timed out. Check the browser's location permission prompt, retry, or search for your area below.",
            "timeout",
          ),
        );
      }
    }, timeoutMs);
    signal?.addEventListener("abort", abort, { once: true });
    try {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          if (settled || !freshBrowserPosition(position)) return;
          if (usableGPS(position)) {
            settled = true;
            cleanup();
            resolve(position);
          } else {
            if (
              !best ||
              !freshBrowserPosition(best) ||
              position.coords.accuracy <= best.coords.accuracy
            )
              best = position;
            onProgress?.(
              `Approximate location received (±${accuracyLabel(position.coords.accuracy)}). Waiting for a more accurate reading…`,
            );
          }
        },
        (error) => {
          if (settled) return;
          lastError = error;
          if (error.code === 1) {
            fail(
              new LocationAcquisitionError(
                "Location access is blocked. Allow location for this site and enable device location services, then retry.",
                "denied",
              ),
            );
          }
          // A watch can recover from timeout/unavailable; keep listening until the deadline.
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: timeoutMs },
      );
      // Also handles synchronous callback implementations in embedded browsers/tests.
      if (settled) navigator.geolocation.clearWatch(watchId);
    } catch (error) {
      fail(
        new LocationAcquisitionError(
          error instanceof Error ? error.message : "Could not request location.",
          "error",
        ),
      );
    }
  });
}
