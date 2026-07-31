import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Razorpay from "razorpay";
import crypto from "crypto";
import { isPlanDurationKey } from "@/lib/plan-pricing";
import { applyProUpgrade } from "@/lib/apply-pro-upgrade";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment fields." }, { status: 400 });
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
  }

  try {
    // The order's notes are the source of truth for who paid and for how
    // long — set server-side at create-order time (see
    // app/api/payment/create-order/route.ts), not trusted from the client.
    const order = await razorpay.orders.fetch(razorpay_order_id);
    const notes = order.notes as { userId?: string; duration?: string } | undefined;

    if (!notes?.userId || notes.userId !== session.user.id) {
      return NextResponse.json({ error: "This order does not belong to your account." }, { status: 403 });
    }
    if (!isPlanDurationKey(notes.duration)) {
      console.error("Razorpay order missing/invalid duration note:", razorpay_order_id, notes);
      return NextResponse.json({ error: "Payment verified but plan duration is unknown. Contact support@conceptra.in" }, { status: 500 });
    }

    const { planExpiresAt } = await applyProUpgrade({
      userId: session.user.id,
      durationKey: notes.duration,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      amountPaise: Number(order.amount),
    });

    return NextResponse.json({ success: true, planExpiresAt });
  } catch (err) {
    console.error("Payment verify failed to upgrade plan:", err);
    return NextResponse.json({ error: "Payment verified but failed to upgrade plan. Contact support@conceptra.in" }, { status: 500 });
  }
}
