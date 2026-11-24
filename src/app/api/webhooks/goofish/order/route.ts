import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeSyncLog } from "@/lib/api-helper";
import { verifyGoofishWebhookSign } from "@/lib/goofish/client";

/**
 * 闲管家订单推送通知接收端点
 * 严格遵循 docs/goofish-api.md：响应报文 result === "success" 才认为推送成功
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const ts = req.nextUrl.searchParams.get("timestamp");
    const sign = req.nextUrl.searchParams.get("sign");

    const valid = await verifyGoofishWebhookSign(rawBody, ts, sign);
    if (!valid) {
      return NextResponse.json({ result: "fail", msg: "签名失败" }, { status: 400 });
    }

    const payload = JSON.parse(rawBody || "{}") as Record<string, unknown>;
    const orderNo = payload.order_no ? String(payload.order_no) : "";

    if (orderNo) {
      await prisma.order.updateMany({
        where: { orderNo },
        data: {
          ...(payload.order_status !== undefined
            ? { orderStatus: Number(payload.order_status) }
            : {}),
          ...(payload.refund_status !== undefined
            ? { refundStatus: Number(payload.refund_status) }
            : {}),
          syncedAt: new Date(),
        },
      });
    }

    await writeSyncLog(
      "WEBHOOK_ORDER",
      orderNo || "unknown",
      "SUCCESS",
      `收到闲管家订单推送 ${orderNo}`,
      payload
    );

    return NextResponse.json({ result: "success", msg: "接收成功" });
  } catch (e) {
    return NextResponse.json(
      { result: "fail", msg: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
