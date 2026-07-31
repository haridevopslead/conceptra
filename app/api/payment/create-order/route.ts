import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Razorpay from "razorpay";
import { PLAN_PRICING, isPlanDurationKey } from "@/lib/plan-pricing";

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
  const duration = body?.plan;

  if (!isPlanDurationKey(duration)) {
    return NextResponse.json({ error: "Invalid plan. Choose monthly, quarterly, or annual." }, { status: 400 });
  }

  // Amount always comes from this server-side lookup, never from the
  // request body — trusting a client-supplied amount would let a tampered
  // request buy Pro for ₹1.
  const { amountPaise } = PLAN_PRICING[duration];

  try {
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `rcpt_${session.user.id.slice(0, 16)}_${Date.now()}`,
      // Read back at verify/webhook time to know who paid and for how long —
      // Razorpay's order notes are visible to both those call sites via
      // orders.fetch() without needing our own order-id -> user mapping table.
      notes: { userId: session.user.id, duration },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      duration,
    });
  } catch (err) {
    console.error("Razorpay order creation failed:", err);
    return NextResponse.json({ error: "Failed to create payment order." }, { status: 500 });
  }
}
