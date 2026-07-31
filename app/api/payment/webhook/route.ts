import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils";
import { isPlanDurationKey } from "@/lib/plan-pricing";
import { applyProUpgrade } from "@/lib/apply-pro-upgrade";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Reliability backstop, independent of the client-side /api/payment/verify
// call: if a user pays and closes the tab before the checkout handler's
// verify request fires, Razorpay still holds the money and this is the only
// path that ever tells our DB about it. Configured as a webhook in
// Razorpay's dashboard — see conceptra_payment_plan_tiers_expiry_prompt.md
// for exact setup steps. Must stay idempotent: Razorpay retries webhook
// deliveries, and this can also race the client verify call for the same
// payment — applyProUpgrade's Payment-row insert is what makes double
// delivery safe.
export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-razorpay-signature");
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("RAZORPAY_WEBHOOK_SECRET is not configured.");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  // Signature verification needs the exact raw bytes Razorpay signed —
  // req.json() would re-serialize and break the HMAC comparison.
  const rawBody = await req.text();

  const isValid = validateWebhookSignature(rawBody, signature, webhookSecret);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const event = JSON.parse(rawBody);

  if (event.event !== "payment.captured") {
    // Ack anything we don't act on so Razorpay doesn't keep retrying it.
    return NextResponse.json({ received: true });
  }

  const payment = event.payload?.payment?.entity;
  if (!payment?.id || !payment?.order_id) {
    console.error("payment.captured webhook missing payment id/order_id:", event);
    return NextResponse.json({ received: true });
  }

  try {
    const order = await razorpay.orders.fetch(payment.order_id);
    const notes = order.notes as { userId?: string; duration?: string } | undefined;

    if (!notes?.userId || !isPlanDurationKey(notes.duration)) {
      console.error("payment.captured webhook: order missing/invalid notes:", payment.order_id, notes);
      return NextResponse.json({ received: true });
    }

    await applyProUpgrade({
      userId: notes.userId,
      durationKey: notes.duration,
      razorpayOrderId: payment.order_id,
      razorpayPaymentId: payment.id,
      amountPaise: Number(payment.amount),
    });

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("payment.captured webhook failed to apply upgrade:", err);
    // 500 so Razorpay retries — this branch means our own DB/logic failed,
    // not that the event was malformed, so a retry has a real chance of succeeding.
    return NextResponse.json({ error: "Failed to process webhook." }, { status: 500 });
  }
}
