import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { getDemoReceipt } from "@/lib/orders-store";

export function DemoOrderReceipt({ orderId }: { orderId: string }) {
  const {
    data: receipt,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["local-demo-receipt", orderId],
    queryFn: () => getDemoReceipt(orderId),
    staleTime: 0,
    gcTime: 0,
  });
  return (
    <AppShell>
      <section className="mx-auto my-8 max-w-2xl rounded-2xl border bg-card p-6">
        <h1 className="font-display text-2xl font-bold">Test payment receipt</h1>
        <p className="my-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-950">
          Test mode only — no real money charged, no stock reserved, and no seller or delivery partner
          notified. This is not a live order.
        </p>
        {isPending ? (
          <p>Loading test receipt…</p>
        ) : isError || !receipt ? (
          <p>
            Receipt unavailable. Sign in with the same account and browser used for test checkout.
          </p>
        ) : (
          <>
            <p className="font-mono text-sm">
              {receipt.code} · {new Date(receipt.createdAt).toLocaleString()}
            </p>
            <h2 className="my-4 text-lg font-semibold">{receipt.storeName}</h2>
            <p className="text-sm text-muted-foreground">{receipt.paymentMethod}</p>
            {receipt.paymentReference && <p className="mt-1 break-all font-mono text-xs">Razorpay reference: {receipt.paymentReference}</p>}
            <ul className="divide-y">
              {receipt.lines.map((line) => (
                <li key={line.productId} className="flex justify-between gap-4 py-3">
                  <span>
                    {line.name} × {line.qty}
                  </span>
                  <span>₹{(line.price * line.qty).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-2 border-t pt-4">
              <p className="flex justify-between">
                <span>Simulated checkout total</span>
                <span>₹{receipt.total.toFixed(2)}</span>
              </p>
              <p className="flex justify-between font-bold">
                <span>Amount actually charged</span>
                <span>₹0.00</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Saved only in this browser for your account. A real purchase requires a separate
                checkout with a real payment method.
              </p>
            </div>
          </>
        )}
        <Link
          to="/"
          className="mt-6 inline-block rounded-xl bg-primary px-5 py-3 text-primary-foreground"
        >
          Continue shopping
        </Link>
      </section>
    </AppShell>
  );
}
