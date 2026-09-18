/**
 * Structured Production Logger & Error Monitoring Bridge
 * Redacts sensitive credentials (passwords, service-role keys, Razorpay secrets, auth tokens)
 * and formats logs with request correlation IDs.
 */

const SENSITIVE_KEYS = [
  "password",
  "secret",
  "service_role",
  "razorpay_secret",
  "key_secret",
  "signature",
  "token",
  "authorization",
  "apikey",
  "cookie",
];

function sanitize(data: any): any {
  if (data === null || data === undefined) return data;
  if (typeof data === "string") {
    if (
      data.startsWith("sb_secret_") ||
      data.startsWith("rzp_live_") ||
      data.startsWith("rzp_test_")
    ) {
      return "[REDACTED_SECRET]";
    }
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(sanitize);
  }
  if (typeof data === "object") {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s))) {
        cleaned[key] = "[REDACTED]";
      } else {
        cleaned[key] = sanitize(value);
      }
    }
    return cleaned;
  }
  return data;
}

export interface LogContext {
  correlationId?: string;
  userId?: string;
  route?: string;
  [key: string]: any;
}

export const logger = {
  info(message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const payload = context ? sanitize(context) : {};
    console.log(JSON.stringify({ level: "info", timestamp, message, ...payload }));
  },

  warn(message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const payload = context ? sanitize(context) : {};
    console.warn(JSON.stringify({ level: "warn", timestamp, message, ...payload }));
  },

  error(message: string, error?: any, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const payload = context ? sanitize(context) : {};
    const errDetails =
      error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : sanitize(error);

    console.error(
      JSON.stringify({
        level: "error",
        timestamp,
        message,
        error: errDetails,
        ...payload,
      }),
    );
  },
};
