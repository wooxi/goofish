import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { fail, ok, writeSyncLog } from "@/lib/api-helper";
import { goofishApi } from "@/lib/goofish/client";

export async function GET(req: NextRequest) {
  try {
    const statusParam = req.nextUrl.searchParams.get("status");
    const where =
      statusParam && statusParam !== "ALL"
        ? { orderStatus: Number(statusParam) }
        : {};
    const orders = await prisma.order.findMany({
      where,
      orderBy: [{ createTime: "desc" }, { id: "desc" }],
      take: 200,
    });
    return ok({ list: orders });
  } catch (e) {
    return fail(e, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action || "");

    if (action === "sync") {
      const pageSize = 50;
      const maxPages = 20;
      let synced = 0;
      let totalCount = 0;

      // Preload product cost bindings for profit calculation
      const products = await prisma.product.findMany({
        select: { productId: true, localCostFen: true, linkedKindId: true },
      });
      const productMap = new Map(products.map((p) => [p.productId, p]));

      const kinds = await prisma.kamiKind.findMany({
        select: { kindId: true, avgCost: true, cost: true },
      });
      const kindMap = new Map(kinds.map((k) => [k.kindId, k]));

      for (let pageNo = 1; pageNo <= maxPages; pageNo++) {
        const resp = await goofishApi.listOrders({
          page_no: pageNo,
          page_size: pageSize,
          ...(body.order_status ? { order_status: Number(body.order_status) } : {}),
          ...(body.authorize_id ? { authorize_id: Number(body.authorize_id) } : {}),
        });
        const list = resp.list ?? [];
        totalCount = resp.count ?? totalCount;

        for (const o of list) {
          const productId = String(o.goods?.product_id ?? "");
          const buyNum = o.goods?.quantity ?? 1;
          const prod = productMap.get(productId);
          let unitCostFen = prod?.localCostFen ?? 0;

          if (!unitCostFen && prod?.linkedKindId) {
            const kind = kindMap.get(prod.linkedKindId);
            if (kind) {
              const yuan = Number(kind.avgCost) > 0 ? Number(kind.avgCost) : Number(kind.cost);
              unitCostFen = Math.round((yuan || 0) * 100);
            }
          }

          const costFen = unitCostFen * buyNum;
          const payAmountFen = o.pay_amount ?? 0;
          const profitFen = payAmountFen - costFen;

          await prisma.order.upsert({
            where: { orderNo: String(o.order_no) },
            update: {
              ...(body.authorize_id ? { authorizeId: String(body.authorize_id) } : {}),
              sellerEid: o.seller_eid ?? "",
              sellerName: o.seller_name ?? "",
              buyerEid: o.buyer_eid ?? "",
              buyerNick: o.buyer_nick ?? "",
              orderStatus: o.order_status ?? 0,
              refundStatus: o.refund_status ?? 0,
              totalAmountFen: o.total_amount ?? 0,
              payAmountFen,
              postFeeFen: o.express_fee ?? 0,
              productId,
              productTitle: o.goods?.title ?? "",
              skuId: String(o.goods?.sku_id ?? ""),
              skuText: o.goods?.sku_text ?? "",
              buyNum,
              costFen,
              profitFen,
              payTime: o.pay_time ?? 0,
              consignTime: o.consign_time ?? 0,
              confirmTime: o.confirm_time ?? 0,
              createTime: o.create_time ?? 0,
              updateTime: o.update_time ?? 0,
              rawJson: JSON.stringify(o),
              syncedAt: new Date(),
            },
            create: {
              orderNo: String(o.order_no),
              authorizeId: body.authorize_id ? String(body.authorize_id) : "",
              sellerEid: o.seller_eid ?? "",
              sellerName: o.seller_name ?? "",
              buyerEid: o.buyer_eid ?? "",
              buyerNick: o.buyer_nick ?? "",
              orderStatus: o.order_status ?? 0,
              refundStatus: o.refund_status ?? 0,
              totalAmountFen: o.total_amount ?? 0,
              payAmountFen,
              postFeeFen: o.express_fee ?? 0,
              productId,
              productTitle: o.goods?.title ?? "",
              skuId: String(o.goods?.sku_id ?? ""),
              skuText: o.goods?.sku_text ?? "",
              buyNum,
              costFen,
              profitFen,
              payTime: o.pay_time ?? 0,
              consignTime: o.consign_time ?? 0,
              confirmTime: o.confirm_time ?? 0,
              createTime: o.create_time ?? 0,
              updateTime: o.update_time ?? 0,
              rawJson: JSON.stringify(o),
            },
          });
          synced += 1;
        }

        if (list.length < pageSize || pageNo * pageSize >= (resp.count ?? 0)) {
          break;
        }
      }

      await writeSyncLog("SYNC_ORDERS", "Order", "SUCCESS", `同步订单 ${synced} 条`);
      return ok({ synced, count: totalCount });
    }

    if (action === "dummySend") {
      const orderNo = String(body.order_no);
      const sendWay = Number(body.send_way) === 1 ? 1 : 2;
      await goofishApi.dummySendOrder({ order_no: orderNo, send_way: sendWay });
      await prisma.order.updateMany({
        where: { orderNo },
        data: { orderStatus: 23, consignTime: Math.floor(Date.now() / 1000) },
      });
      await writeSyncLog(
        "DUMMY_SEND",
        orderNo,
        "SUCCESS",
        `订单 ${orderNo} 无需物流发货成功（send_way=${sendWay}）`
      );
      return ok({ sent: true });
    }

    if (action === "modifyPrice") {
      const orderNo = String(body.order_no);
      const orderPriceFen = Number(body.order_price);
      const expressFeeFen = Number(body.express_fee ?? 0);
      await goofishApi.modifyOrderPrice(orderNo, orderPriceFen, expressFeeFen);
      await prisma.order.updateMany({
        where: { orderNo },
        data: { totalAmountFen: orderPriceFen, postFeeFen: expressFeeFen },
      });
      return ok({ modified: true });
    }

    if (action === "detail") {
      const orderNo = String(body.order_no);
      const [detail, kamsResp] = await Promise.all([
        goofishApi.getOrderDetail(orderNo),
        goofishApi.listOrderKams(orderNo).catch(() => ({ list: [] })),
      ]);
      const kamList = kamsResp.list ?? [];
      if (kamList.length > 0) {
        const realCostFen = kamList.reduce((acc, k) => acc + (Number(k.cost) || 0), 0);
        const existing = await prisma.order.findUnique({ where: { orderNo } });
        if (existing) {
          await prisma.order.update({
            where: { orderNo },
            data: {
              costFen: realCostFen,
              profitFen: existing.payAmountFen - realCostFen,
            },
          });
        }
      }
      return ok({ detail, kams: kamList });
    }

    return fail("不支持的操作类型", 400);
  } catch (e) {
    return fail(e, 400);
  }
}
