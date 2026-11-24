import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { writeSyncLog } from "@/lib/api-helper";
import { verifyGoofishWebhookSign } from "@/lib/goofish/client";
import { matchGoofishErrorTip } from "@/lib/goofish/dictionaries";

/**
 * 闲管家 商品回调通知 & 商品推送通知 接收端点
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
    const productId = payload.product_id ? String(payload.product_id) : "";

    if (productId) {
      const tip = matchGoofishErrorTip(
        String(payload.err_code || ""),
        String(payload.err_msg || "")
      );
      const errorText =
        payload.task_result === 2 || payload.err_msg
          ? tip
            ? `${tip.errMsg}（${tip.content}）`
            : String(payload.err_msg || payload.err_code || "发布失败")
          : "";

      await prisma.product.updateMany({
        where: { productId },
        data: {
          ...(payload.publish_status !== undefined
            ? { publishStatus: Number(payload.publish_status) }
            : {}),
          ...(payload.product_status !== undefined
            ? { productStatus: Number(payload.product_status) }
            : {}),
          errorMsg: errorText,
          syncedAt: new Date(),
        },
      });
    }

    await writeSyncLog(
      "WEBHOOK_PRODUCT",
      productId || "unknown",
      payload.task_result === 2 ? "ERROR" : "SUCCESS",
      String(payload.err_msg || `商品状态推送 product_id=${productId}`),
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
