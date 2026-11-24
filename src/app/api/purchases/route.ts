import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { fail, ok, writeSyncLog } from "@/lib/api-helper";
import { goofishApi } from "@/lib/goofish/client";

const supplierSchema = z.object({
  name: z.string().trim().min(1, "供应商名称不能为空"),
  contact: z.string().trim().optional().default(""),
  channel: z.string().trim().optional().default(""),
  remark: z.string().trim().optional().default(""),
});

const batchSchema = z.object({
  supplierId: z.number().int().positive().nullable().optional(),
  kindId: z.string().trim().min(1, "请选择卡种"),
  kindName: z.string().trim().optional().default(""),
  unitCostFen: z.number().int().min(0),
  remark: z.string().trim().optional().default(""),
  pushToGoofish: z.boolean().optional().default(true),
  isCover: z.boolean().optional().default(false),
  isRepeat: z.boolean().optional().default(false),
  isPriority: z.boolean().optional().default(true),
  cards: z
    .array(
      z.object({
        card_no: z.string().trim().min(1),
        card_pwd: z.string().trim().optional().default(""),
      })
    )
    .min(1, "至少需要导入 1 条卡密"),
});

export async function GET() {
  try {
    const [suppliers, batches, cardStats] = await Promise.all([
      prisma.supplier.findMany({ orderBy: { id: "desc" } }),
      prisma.purchaseBatch.findMany({
        include: { supplier: true },
        orderBy: { id: "desc" },
        take: 100,
      }),
      prisma.localCardItem.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
    ]);

    return ok({ suppliers, batches, cardStats });
  } catch (e) {
    return fail(e, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action || "");

    if (action === "createSupplier") {
      const parsed = supplierSchema.parse(body);
      const supplier = await prisma.supplier.create({ data: parsed });
      return ok(supplier);
    }

    if (action === "createBatch") {
      const parsed = batchSchema.parse(body);
      const batchNo = `PO${Date.now()}`;
      const quantity = parsed.cards.length;
      const totalCostFen = parsed.unitCostFen * quantity;

      let pushedToGoofish = false;
      let goofishSyncMsg = "仅本地入库";

      if (parsed.pushToGoofish) {
        await goofishApi.createKamiStorage({
          kind_id: Number(parsed.kindId),
          cost: parsed.unitCostFen,
          is_cover: parsed.isCover,
          is_repeat: parsed.isRepeat,
          is_priority: parsed.isPriority,
          cards: parsed.cards.map((c) => ({
            card_no: c.card_no,
            card_pwd: c.card_pwd || c.card_no,
          })),
        });
        pushedToGoofish = true;
        goofishSyncMsg = `已推送 ${quantity} 条卡密至闲管家`;
      }

      const batch = await prisma.purchaseBatch.create({
        data: {
          batchNo,
          supplierId: parsed.supplierId ?? null,
          kindId: parsed.kindId,
          kindName: parsed.kindName,
          quantity,
          unitCostFen: parsed.unitCostFen,
          totalCostFen,
          pushedToGoofish,
          goofishSyncMsg,
          remark: parsed.remark,
          cards: {
            create: parsed.cards.map((c) => ({
              kindId: parsed.kindId,
              cardNo: c.card_no,
              cardPwd: c.card_pwd || c.card_no,
              unitCostFen: parsed.unitCostFen,
              status: pushedToGoofish ? "PUSHED" : "IN_STOCK",
            })),
          },
        },
        include: { supplier: true },
      });

      await writeSyncLog(
        "PURCHASE_IMPORT",
        parsed.kindId,
        "SUCCESS",
        `采购批次 ${batchNo} 入库 ${quantity} 条（${goofishSyncMsg}）`
      );

      return ok(batch);
    }

    return fail("不支持的操作类型", 400);
  } catch (e) {
    await writeSyncLog(
      "PURCHASE_IMPORT",
      "Batch",
      "ERROR",
      e instanceof Error ? e.message : String(e)
    );
    return fail(e, 400);
  }
}
