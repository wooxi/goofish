import { prisma } from "@/lib/db";
import { fail, ok, writeSyncLog } from "@/lib/api-helper";
import { goofishApi } from "@/lib/goofish/client";

export async function GET() {
  try {
    const shops = await prisma.shop.findMany({ orderBy: { id: "asc" } });
    return ok({ list: shops });
  } catch (e) {
    return fail(e, 500);
  }
}

export async function POST() {
  try {
    const data = await goofishApi.listShops();
    const list = data.list ?? [];

    for (const s of list) {
      await prisma.shop.upsert({
        where: { authorizeId: String(s.authorize_id) },
        update: {
          authorizeExpires: s.authorize_expires ?? 0,
          userIdentity: s.user_identity ?? "",
          userName: s.user_name ?? "",
          userNick: s.user_nick ?? "",
          shopName: s.shop_name ?? "",
          serviceSupport: s.service_support ?? "",
          isDepositEnough: Boolean(s.is_deposit_enough),
          isPro: Boolean(s.is_pro),
          isValid: Boolean(s.is_valid),
          isTrial: Boolean(s.is_trial),
          validEndTime: s.valid_end_time ?? 0,
          itemBizTypes: s.item_biz_types ?? "",
          syncedAt: new Date(),
        },
        create: {
          authorizeId: String(s.authorize_id),
          authorizeExpires: s.authorize_expires ?? 0,
          userIdentity: s.user_identity ?? "",
          userName: s.user_name ?? "",
          userNick: s.user_nick ?? "",
          shopName: s.shop_name ?? "",
          serviceSupport: s.service_support ?? "",
          isDepositEnough: Boolean(s.is_deposit_enough),
          isPro: Boolean(s.is_pro),
          isValid: Boolean(s.is_valid),
          isTrial: Boolean(s.is_trial),
          validEndTime: s.valid_end_time ?? 0,
          itemBizTypes: s.item_biz_types ?? "",
        },
      });
    }

    const activeIds = list.map((s) => String(s.authorize_id));
    await prisma.shop.deleteMany({
      where: activeIds.length > 0 ? { authorizeId: { notIn: activeIds } } : {},
    });

    await writeSyncLog("SYNC_SHOPS", "Shop", "SUCCESS", `同步闲鱼店铺 ${list.length} 个`);
    const shops = await prisma.shop.findMany({ orderBy: { id: "asc" } });
    return ok({ synced: list.length, list: shops });
  } catch (e) {
    await writeSyncLog("SYNC_SHOPS", "Shop", "ERROR", e instanceof Error ? e.message : String(e));
    return fail(e, 400);
  }
}
