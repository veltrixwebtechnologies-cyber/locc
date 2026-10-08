import { createHmac, timingSafeEqual } from "node:crypto";

export interface ApprovedRefundRequest {
  localRefundId: string;
  paymentId: string;
  amountPaise: number;
  idempotencyKey: string;
}

export interface RazorpayRefundTransport {
  createRefund(input: ApprovedRefundRequest): Promise<{
    id: string;
    status: "pending" | "processed" | "failed";
    errorDescription?: string;
  }>;
}

export interface ApprovedRefundRepository {
  getApprovedRefund(refundId: string): Promise<ApprovedRefundRequest & { status: string }>;
  markProcessing(refundId: string, gatewayRefundId: string): Promise<void>;
  markFailed(refundId: string, reason: string): Promise<void>;
}

export async function submitApprovedRefund(
  request: ApprovedRefundRequest,
  transport: RazorpayRefundTransport,
) {
  if (!request.localRefundId || !request.paymentId || !request.idempotencyKey) {
    throw new Error("Refund identifiers and idempotency key are required");
  }
  if (!Number.isSafeInteger(request.amountPaise) || request.amountPaise <= 0) {
    throw new Error("Refund amount must be positive integer paise");
  }
  const response = await transport.createRefund(request);
  if (!response.id || !["pending", "processed", "failed"].includes(response.status)) {
    throw new Error("Invalid refund provider response");
  }
  return {
    gatewayRefundId: response.id,
    // Provider acceptance/response is not the final customer-facing state.
    // The verified provider webhook (or reconciliation) supplies completion.
    status: response.status === "failed" ? "failed" : "processing",
    ...(response.status === "failed" && response.errorDescription
      ? { failureReason: response.errorDescription.slice(0, 500) }
      : {}),
  } as const;
}

/**
 * Server orchestration contract. Repository implementations must use trusted
 * server credentials and the prepared service-role RPCs. No endpoint wires
 * this function yet, so this code cannot issue a provider request by itself.
 */
export async function processApprovedRefund(
  refundId: string,
  repository: ApprovedRefundRepository,
  transport: RazorpayRefundTransport,
) {
  const refund = await repository.getApprovedRefund(refundId);
  if (refund.status !== "approved") throw new Error("Only approved refunds can be submitted");
  const result = await submitApprovedRefund(refund, transport);
  if (result.status === "failed") {
    await repository.markFailed(refundId, result.failureReason ?? "Provider rejected the refund");
  } else {
    await repository.markProcessing(refundId, result.gatewayRefundId);
  }
  return result;
}

export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
  webhookSecret: string | undefined,
): boolean {
  if (!rawBody || !/^[a-f0-9]{64}$/i.test(signature) || !webhookSecret) return false;
  try {
    const expected = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
    const expectedBytes = Buffer.from(expected, "hex");
    const receivedBytes = Buffer.from(signature, "hex");
    return (
      expectedBytes.length === receivedBytes.length && timingSafeEqual(expectedBytes, receivedBytes)
    );
  } catch {
    return false;
  }
}

export type RefundWebhookEvent = "refund.created" | "refund.processed" | "refund.failed";
export type RefundWebhookStatus = "processing" | "refunded" | "failed";

export function parseRefundWebhook(payload: unknown): {
  event: RefundWebhookEvent;
  gatewayRefundId: string;
  status: RefundWebhookStatus;
  failureReason?: string;
} | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, any>;
  const event = data.event as string;
  const entity = data.payload?.refund?.entity;
  if (!entity?.id) return null;
  if (event === "refund.created")
    return { event, gatewayRefundId: entity.id, status: "processing" };
  if (event === "refund.processed")
    return { event, gatewayRefundId: entity.id, status: "refunded" };
  if (event === "refund.failed") {
    return {
      event,
      gatewayRefundId: entity.id,
      status: "failed",
      ...(typeof entity.error_description === "string"
        ? { failureReason: entity.error_description.slice(0, 500) }
        : {}),
    };
  }
  return null;
}

/** Client-side guard for tests only; durable deduplication belongs to the DB event ledger. */
export function canApplyRefundWebhook(input: {
  eventId: string | null;
  seenEventIds: ReadonlySet<string>;
  currentStatus: string;
  incomingStatus: RefundWebhookStatus;
}): boolean {
  if (!input.eventId || input.seenEventIds.has(input.eventId)) return false;
  const allowed: Record<string, readonly RefundWebhookStatus[]> = {
    approved: ["processing", "refunded", "failed"],
    processing: ["processing", "refunded", "failed"],
  };
  return allowed[input.currentStatus]?.includes(input.incomingStatus) ?? false;
}
