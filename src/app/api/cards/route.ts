import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api-helper";

export async function GET(req: NextRequest) {
  try {
    const kindId = req.nextUrl.searchParams.get("kindId");
    const status = req.nextUrl.searchParams.get("status");
    const q = req.nextUrl.searchParams.get("q")?.trim();

    const where: Record<string, unknown> = {};
    if (kindId && kindId !== "ALL") where.kindId = kindId;
    if (status && status !== "ALL") where.status = status;
    if (q) {
      where.OR = [
        { cardNo: { contains: q } },
        { orderNo: { contains: q } },
      ];
    }

    const list = await prisma.localCardItem.findMany({
      where,
      include: { batch: { select: { batchNo: true, kindName: true } } },
      orderBy: { id: "desc" },
      take: 300,
    });
    return ok({ list });
  } catch (e) {
    return fail(e, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action || "");

    if (action === "updateStatus") {
      const ids = (body.ids as number[]).map(Number);
      const status = String(body.status || "VOID");
      if (!["IN_STOCK", "PUSHED", "SOLD", "VOID"].includes(status)) {
        return fail("无效状态", 400);
      }
      await prisma.localCardItem.updateMany({
        where: { id: { in: ids } },
        data: { status },
      });
      return ok({ updated: ids.length });
    }

    return fail("不支持的操作类型", 400);
  } catch (e) {
    return fail(e, 400);
  }
}
