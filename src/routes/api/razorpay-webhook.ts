import { createFileRoute } from "@tanstack/react-router";
import { processRazorpayWebhookFn } from "@/lib/razorpay-webhook.functions";

export const Route = createFileRoute("/api/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const rawBody = await request.text();
          const signature = request.headers.get("x-razorpay-signature") || "";

          const result = await processRazorpayWebhookFn({
            data: {
              rawBody,
              signature,
            },
          });

          return Response.json(result, { status: 200 });
        } catch (err: any) {
          console.error("[api/razorpay-webhook] Error handling webhook:", err);
          return Response.json(
            { error: err.message || "Failed to process webhook" },
            { status: 400 }
          );
        }
      },
    },
  },
});
