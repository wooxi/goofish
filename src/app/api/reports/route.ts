import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api-helper";

export async function GET(req: NextRequest) {
  try {
    const format = req.nextUrl.searchParams.get("format");
    const [orders, refunds, batches] = await Promise.all([
      prisma.order.findMany({ orderBy: { createTime: "desc" } }),
      prisma.refundOrder.findMany({ where: { refundStatus: 5 } }),
      prisma.purchaseBatch.findMany({ include: { supplier: true }, orderBy: { id: "desc" } }),
    ]);

    const refundByOrder = new Map<string, number>();
    for (const r of refunds) {
      refundByOrder.set(r.orderNo, (refundByOrder.get(r.orderNo) ?? 0) + r.refundAmountFen);
    }

    if (format === "csv") {
      const header = "订单号,商品标题,买家,数量,实付(元),成本(元),已退款(元),净毛利(元),状态\n";
      const rows = orders
        .map((o) => {
          const refFen = refundByOrder.get(o.orderNo) ?? 0;
          const netProfit = o.payAmountFen - o.costFen - refFen;
          const title = `"${(o.productTitle || "").replace(/"/g, '""')}"`;
          return [
            o.orderNo,
            title,
            o.buyerNick,
            o.buyNum,
            (o.payAmountFen / 100).toFixed(2),
            (o.costFen / 100).toFixed(2),
            (refFen / 100).toFixed(2),
            (netProfit / 100).toFixed(2),
            o.orderStatus,
          ].join(",");
        })
        .join("\n");

      return new NextResponse("\uFEFF" + header + rows, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="goofish-orders-${Date.now()}.csv"`,
        },
      });
    }

    // Aggregate by product
    const byProduct = new Map<
      string,
      {
        productId: string;
        title: string;
        orderCount: number;
        qty: number;
        revenueFen: number;
        costFen: number;
        refundFen: number;
        netProfitFen: number;
      }
    >();

    for (const o of orders) {
      const refFen = refundByOrder.get(o.orderNo) ?? 0;
      const cur = byProduct.get(o.productId) ?? {
        productId: o.productId,
        title: o.productTitle || o.productId,
        orderCount: 0,
        qty: 0,
        revenueFen: 0,
        costFen: 0,
        refundFen: 0,
        netProfitFen: 0,
      };
      cur.orderCount += 1;
      cur.qty += o.buyNum;
      cur.revenueFen += o.payAmountFen;
      cur.costFen += o.costFen;
      cur.refundFen += refFen;
      cur.netProfitFen += o.payAmountFen - o.costFen - refFen;
      byProduct.set(o.productId, cur);
    }

    // Aggregate by supplier
    const bySupplier = new Map<
      string,
      { supplierName: string; batchCount: number; quantity: number; totalCostFen: number }
    >();
    for (const b of batches) {
      const sName = b.supplier?.name || "未指定";
      const cur = bySupplier.get(sName) ?? {
        supplierName: sName,
        batchCount: 0,
        quantity: 0,
        totalCostFen: 0,
      };
      cur.batchCount += 1;
      cur.quantity += b.quantity;
      cur.totalCostFen += b.totalCostFen;
      bySupplier.set(sName, cur);
    }

    const totalRevenueFen = orders.reduce((s, o) => s + o.payAmountFen, 0);
    const totalCostFen = orders.reduce((s, o) => s + o.costFen, 0);
    const totalRefundFen = refunds.reduce((s, r) => s + r.refundAmountFen, 0);

    return ok({
      summary: {
        orderCount: orders.length,
        totalRevenueFen,
        totalCostFen,
        totalRefundFen,
        netProfitFen: totalRevenueFen - totalCostFen - totalRefundFen,
      },
      byProduct: Array.from(byProduct.values()).sort((a, b) => b.revenueFen - a.revenueFen),
      bySupplier: Array.from(bySupplier.values()).sort((a, b) => b.totalCostFen - a.totalCostFen),
    });
  } catch (e) {
    return fail(e, 500);
  }
}
