import "server-only";
import { randomInt } from "crypto";
import { prisma } from "./db";
import { COUPON_VALID_DAYS, INSTALL_BONUS, REWARDS } from "@/content/rewards";

// Points live in GuestUser.points (changed atomically, so two taps can never
// spend the same points twice) with every change also written to PointsEntry.

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I

function newCode(): string {
  let s = "";
  for (let i = 0; i < 5; i++) s += CODE_CHARS[randomInt(CODE_CHARS.length)];
  return `BAL-${s}`;
}

export type CouponDTO = {
  code: string;
  reward: string;
  title: string;
  cost: number;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
};
export type LoyaltyDTO = {
  points: number;
  installBonus: boolean;
  coupons: CouponDTO[];
  history: { amount: number; reason: string; note: string; createdAt: string }[];
};

export async function getLoyalty(guestId: number): Promise<LoyaltyDTO> {
  const [guest, coupons, history] = await Promise.all([
    prisma.guestUser.findUnique({ where: { id: guestId }, select: { points: true, installBonusAt: true } }),
    prisma.coupon.findMany({ where: { guestId }, orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.pointsEntry.findMany({ where: { guestId }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  return {
    points: guest?.points ?? 0,
    installBonus: !!guest?.installBonusAt,
    coupons: coupons.map((c) => ({
      code: c.code,
      reward: c.reward,
      title: c.title,
      cost: c.cost,
      createdAt: c.createdAt.toISOString(),
      expiresAt: c.expiresAt.toISOString(),
      usedAt: c.usedAt?.toISOString() ?? null,
    })),
    history: history.map((h) => ({ amount: h.amount, reason: h.reason, note: h.note, createdAt: h.createdAt.toISOString() })),
  };
}

/** Grants the install bonus once per account. Returns true when it was granted now. */
export async function grantInstallBonus(guestId: number): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.guestUser.updateMany({
      where: { id: guestId, installBonusAt: null },
      data: { installBonusAt: new Date(), points: { increment: INSTALL_BONUS } },
    });
    if (!count) return false;
    await tx.pointsEntry.create({ data: { guestId, amount: INSTALL_BONUS, reason: "install" } });
    return true;
  });
}

export type BuyResult = { ok: true; coupon: CouponDTO } | { ok: false; error: "unknown_reward" | "not_enough_points" };

/** Spends points on a reward and issues a coupon with a code for the staff. */
export async function buyCoupon(guestId: number, rewardKey: string): Promise<BuyResult> {
  const reward = REWARDS.find((r) => r.key === rewardKey);
  if (!reward) return { ok: false, error: "unknown_reward" };

  return prisma.$transaction(async (tx) => {
    const { count } = await tx.guestUser.updateMany({
      where: { id: guestId, points: { gte: reward.cost } },
      data: { points: { decrement: reward.cost } },
    });
    if (!count) return { ok: false as const, error: "not_enough_points" as const };

    let code = newCode();
    for (let i = 0; i < 5 && (await tx.coupon.findUnique({ where: { code }, select: { id: true } })); i++) code = newCode();

    const coupon = await tx.coupon.create({
      data: {
        code,
        guestId,
        reward: reward.key,
        title: reward.title.pl,
        cost: reward.cost,
        expiresAt: new Date(Date.now() + COUPON_VALID_DAYS * 86_400_000),
      },
    });
    await tx.pointsEntry.create({ data: { guestId, amount: -reward.cost, reason: "coupon", note: reward.title.pl } });
    return {
      ok: true as const,
      coupon: {
        code: coupon.code,
        reward: coupon.reward,
        title: coupon.title,
        cost: coupon.cost,
        createdAt: coupon.createdAt.toISOString(),
        expiresAt: coupon.expiresAt.toISOString(),
        usedAt: null,
      },
    };
  });
}
