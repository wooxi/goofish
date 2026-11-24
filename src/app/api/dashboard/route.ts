import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api-helper";

export async function GET() {
  try {
    const [orders, kinds, batches, refunds, succeededRefunds, shops, logs] = await Promise.all([
      prisma.order.findMany({ orderBy: { createTime: "desc" } }),
      prisma.kamiKind.findMany({ orderBy: { stock: "asc" } }),
      prisma.purchaseBatch.findMany({ orderBy: { id: "desc" } }),
      prisma.refundOrder.findMany({ where: { refundStatus: { in: [1, 3, 8] } } }),
      prisma.refundOrder.findMany({ where: { refundStatus: 5 } }),
      prisma.shop.findMany(),
      prisma.syncLog.findMany({ orderBy: { id: "desc" }, take: 8 }),
    ]);

    const totalRevenueFen = orders.reduce((acc, o) => acc + o.payAmountFen, 0);
    const totalCostFen = orders.reduce((acc, o) => acc + o.costFen, 0);
    const totalRefundFen = succeededRefunds.reduce((acc, r) => acc + r.refundAmountFen, 0);
    const totalProfitFen = totalRevenueFen - totalCostFen - totalRefundFen;
    const totalKamiStock = kinds.reduce((acc, k) => acc + k.stock, 0);
    const totalPurchaseFen = batches.reduce((acc, b) => acc + b.totalCostFen, 0);
    const pendingShipCount = orders.filter((o) => o.orderStatus === 22).length;
    const lowStockKinds = kinds.filter((k) => k.stock <= Math.max(k.stockWarning, 5)).slice(0, 6);
    const nowSec = Math.floor(Date.now() / 1000);
    const expiringShops = shops.filter(
      (s) => s.authorizeExpires > 0 && s.authorizeExpires - nowSec < 30 * 86400
    );

    // 7-day trend
    const now = new Date();
    const trend: Array<{ date: string; revenue: number; cost: number; profit: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().slice(5, 10);
      const dayStart = Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 1000);
      const dayEnd = dayStart + 86400;
      const dayOrders = orders.filter((o) => o.createTime >= dayStart && o.createTime < dayEnd);
      const rev = dayOrders.reduce((s, o) => s + o.payAmountFen, 0) / 100;
      const cost = dayOrders.reduce((s, o) => s + o.costFen, 0) / 100;
      trend.push({
        date: dayStr,
        revenue: Number(rev.toFixed(2)),
        cost: Number(cost.toFixed(2)),
        profit: Number((rev - cost).toFixed(2)),
      });
    }

    return ok({
      kpi: {
        shopCount: shops.length,
        orderCount: orders.length,
        pendingShipCount,
        pendingRefundCount: refunds.length,
        totalKamiStock,
        totalRevenueFen,
        totalCostFen,
        totalProfitFen,
        totalPurchaseFen,
      },
      lowStockKinds,
      expiringShops,
      trend,
      logs,
    });
  } catch (e) {
    return fail(e, 500);
  }
}
