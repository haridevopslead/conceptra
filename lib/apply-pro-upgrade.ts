import { db } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { PLAN_PRICING, type PlanDurationKey } from "@/lib/plan-pricing";

type ApplyProUpgradeArgs = {
  userId: string;
  durationKey: PlanDurationKey;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  amountPaise: number;
};

type ApplyProUpgradeResult = {
  // false means this payment ID was already processed by the other call
  // site (verify vs. webhook racing, or a duplicate webhook delivery) —
  // the plan/expiry below reflect whatever that earlier call already did,
  // not a second application of it.
  applied: boolean;
  planExpiresAt: Date;
};

// Shared by app/api/payment/verify/route.ts (client-side, fires right after
// checkout) and app/api/payment/webhook/route.ts (Razorpay's
// payment.captured event, a reliability backstop for when the client never
// gets to fire verify — closed tab, network drop, etc). Both call this with
// the same razorpayPaymentId for a given payment, so it has to be safe to
// call twice: the Payment insert is the idempotency guard, and it happens
// inside the same transaction as the plan/expiry update so a payment is
// never recorded without the upgrade actually landing (or vice versa).
export async function applyProUpgrade({
  userId,
  durationKey,
  razorpayOrderId,
  razorpayPaymentId,
  amountPaise,
}: ApplyProUpgradeArgs): Promise<ApplyProUpgradeResult> {
  const { days, dbDuration } = PLAN_PRICING[durationKey];

  try {
    return await db.$transaction(async (tx) => {
      // Insert first: if another concurrent call already recorded this
      // payment ID, this throws (unique constraint) and neither the Payment
      // row nor the User update from *this* call is committed.
      await tx.payment.create({
        data: { userId, razorpayOrderId, razorpayPaymentId, amountPaise, duration: dbDuration },
      });

      const user = await tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: { plan: true, planExpiresAt: true },
      });

      const now = new Date();
      // Renewing early extends the existing expiry instead of resetting the
      // clock to today; a lapsed (or never-set) expiry starts fresh from now.
      const base = user.plan === "PRO" && user.planExpiresAt && user.planExpiresAt > now
        ? user.planExpiresAt
        : now;
      const planExpiresAt = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

      await tx.user.update({
        where: { id: userId },
        data: { plan: "PRO", planExpiresAt },
      });

      return { applied: true, planExpiresAt };
    });
  } catch (err) {
    const isDuplicatePayment =
      err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
    if (!isDuplicatePayment) throw err;

    const user = await db.user.findUnique({ where: { id: userId }, select: { planExpiresAt: true } });
    return { applied: false, planExpiresAt: user?.planExpiresAt ?? new Date() };
  }
}
