import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { fail, ok, writeSyncLog } from "@/lib/api-helper";
import { goofishApi } from "@/lib/goofish/client";

export async function GET() {
  try {
    const refunds = await prisma.refundOrder.findMany({
      orderBy: [{ applyTime: "desc" }, { id: "desc" }],
      take: 200,
    });
    return ok({ list: refunds });
  } catch (e) {
    return fail(e, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action || "");

    if (action === "sync") {
      const resp = await goofishApi.listRefunds({
        page_no: Number(body.page_no || 1),
        page_size: Number(body.page_size || 50),
        ...(body.refund_status !== undefined ? { refund_status: Number(body.refund_status) } : {}),
      });
      const list = resp.list ?? [];

      for (const r of list) {
        await prisma.refundOrder.upsert({
          where: { refundNo: String(r.refund_no) },
          update: {
            orderNo: String(r.order_no),
            sellerEid: r.seller_eid ?? "",
            sellerName: r.seller_name ?? "",
            goodsStatus: r.goods_status ?? 0,
            refundType: r.refund_type ?? 0,
            refundStatus: r.refund_status ?? 0,
            refundAmountFen: r.refund_amount ?? 0,
            applyAmountFen: r.apply_amount ?? 0,
            applyTime: r.apply_time ?? 0,
            refundTime: r.refund_time ?? 0,
            timeoutTime: r.timeout_time ?? 0,
            timeoutStatus: r.timeout_status ?? 0,
            timeoutType: r.timeout_type ?? 0,
            waybillNo: r.waybill_no ?? "",
            expressCode: r.express_code ?? "",
            rejectTime: r.reject_time ?? 0,
            refundReason: r.refund_reason ?? "",
            syncedAt: new Date(),
          },
          create: {
            refundNo: String(r.refund_no),
            orderNo: String(r.order_no),
            sellerEid: r.seller_eid ?? "",
            sellerName: r.seller_name ?? "",
            goodsStatus: r.goods_status ?? 0,
            refundType: r.refund_type ?? 0,
            refundStatus: r.refund_status ?? 0,
            refundAmountFen: r.refund_amount ?? 0,
            applyAmountFen: r.apply_amount ?? 0,
            applyTime: r.apply_time ?? 0,
            refundTime: r.refund_time ?? 0,
            timeoutTime: r.timeout_time ?? 0,
            timeoutStatus: r.timeout_status ?? 0,
            timeoutType: r.timeout_type ?? 0,
            waybillNo: r.waybill_no ?? "",
            expressCode: r.express_code ?? "",
            rejectTime: r.reject_time ?? 0,
            refundReason: r.refund_reason ?? "",
          },
        });
      }

      await writeSyncLog("SYNC_REFUNDS", "RefundOrder", "SUCCESS", `同步售后单 ${list.length} 条`);
      return ok({ synced: list.length, has_next_page: resp.has_next_page });
    }

    if (action === "agree") {
      const orderNo = String(body.order_no);
      const returnExplain = body.return_explain ? String(body.return_explain) : undefined;
      await goofishApi.agreeRefund(orderNo, returnExplain);
      await prisma.refundOrder.updateMany({
        where: { orderNo },
        data: { refundStatus: 5 },
      });
      await writeSyncLog("AGREE_REFUND", orderNo, "SUCCESS", `已同意订单 ${orderNo} 退款`);
      return ok({ agreed: true });
    }

    if (action === "refuse") {
      const orderNo = String(body.order_no);
      const refuseReason = String(body.refuse_reason || "").trim();
      const refuseExplain = body.refuse_explain ? String(body.refuse_explain).trim() : undefined;
      if (!refuseReason) return fail("拒绝原因不能为空", 400);
      await goofishApi.refuseRefund({
        order_no: orderNo,
        refuse_reason: refuseReason,
        ...(refuseExplain ? { refuse_explain: refuseExplain } : {}),
        ...(Array.isArray(body.refuse_images) && body.refuse_images.length > 0
          ? { refuse_images: body.refuse_images }
          : {}),
      });
      await prisma.refundOrder.updateMany({
        where: { orderNo },
        data: { refundStatus: 6, rejectTime: Math.floor(Date.now() / 1000) },
      });
      await writeSyncLog("REFUSE_REFUND", orderNo, "SUCCESS", `已拒绝订单 ${orderNo} 退款`);
      return ok({ refused: true });
    }

    if (action === "detail") {
      const orderNo = String(body.order_no);
      const detail = await goofishApi.getRefundDetail(orderNo);
      return ok(detail);
    }

    return fail("不支持的操作类型", 400);
  } catch (e) {
    return fail(e, 400);
  }
}
