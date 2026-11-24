import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { fail, ok, writeSyncLog } from "@/lib/api-helper";
import { goofishApi } from "@/lib/goofish/client";

export async function GET() {
  try {
    const [categories, kinds, groups] = await Promise.all([
      prisma.kamiCategory.findMany({ orderBy: { id: "desc" } }),
      prisma.kamiKind.findMany({ orderBy: [{ sort: "desc" }, { id: "desc" }] }),
      prisma.kamiGroup.findMany({ orderBy: { id: "desc" } }),
    ]);
    return ok({ categories, kinds, groups });
  } catch (e) {
    return fail(e, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body.action || "");

    if (action === "sync") {
      const [catResp, kindResp, groupResp] = await Promise.all([
        goofishApi.listKamiCategories(),
        goofishApi.listKamiKinds({ page_no: 1, page_size: 100 }),
        goofishApi.listKamiGroups({ page_no: 1, page_size: 50 }),
      ]);

      for (const c of catResp.list ?? []) {
        await prisma.kamiCategory.upsert({
          where: { categoryId: String(c.category_id) },
          update: {
            categoryName: c.category_name,
            remark: c.remark ?? "",
            createTime: c.create_time ?? "",
            updateTime: c.update_time ?? "",
            syncedAt: new Date(),
          },
          create: {
            categoryId: String(c.category_id),
            categoryName: c.category_name,
            remark: c.remark ?? "",
            createTime: c.create_time ?? "",
            updateTime: c.update_time ?? "",
          },
        });
      }

      for (const k of kindResp.list ?? []) {
        await prisma.kamiKind.upsert({
          where: { kindId: String(k.kind_id) },
          update: {
            kindName: k.kind_name,
            kindAlias: k.kind_alias ?? "",
            kindCategory: String(k.kind_category ?? 0),
            kindCategoryName: k.kind_category_name ?? "",
            kindType: k.kind_type ?? 1,
            cost: k.cost ?? "0.00",
            avgCost: k.avg_cost ?? "0.00",
            stock: k.stock ?? 0,
            sold: k.sold ?? 0,
            totalCost: k.total_cost ?? "0.00",
            totalStock: k.total_stock ?? 0,
            cardType: k.card_type ?? 1,
            pwdType: k.pwd_type ?? 1,
            cardPrefix: k.card_prefix ?? "",
            pwdPrefix: k.pwd_prefix ?? "",
            prioritySale: k.priority_sale ?? 1,
            separator: k.separator ?? 0,
            stockWarning: k.stock_warning ?? 0,
            sort: k.sort ?? 0,
            modifyTime: k.modify_time ?? "",
            createTime: k.create_time ?? "",
            syncedAt: new Date(),
          },
          create: {
            kindId: String(k.kind_id),
            kindName: k.kind_name,
            kindAlias: k.kind_alias ?? "",
            kindCategory: String(k.kind_category ?? 0),
            kindCategoryName: k.kind_category_name ?? "",
            kindType: k.kind_type ?? 1,
            cost: k.cost ?? "0.00",
            avgCost: k.avg_cost ?? "0.00",
            stock: k.stock ?? 0,
            sold: k.sold ?? 0,
            totalCost: k.total_cost ?? "0.00",
            totalStock: k.total_stock ?? 0,
            cardType: k.card_type ?? 1,
            pwdType: k.pwd_type ?? 1,
            cardPrefix: k.card_prefix ?? "",
            pwdPrefix: k.pwd_prefix ?? "",
            prioritySale: k.priority_sale ?? 1,
            separator: k.separator ?? 0,
            stockWarning: k.stock_warning ?? 0,
            sort: k.sort ?? 0,
            modifyTime: k.modify_time ?? "",
            createTime: k.create_time ?? "",
          },
        });
      }

      for (const g of groupResp.list ?? []) {
        await prisma.kamiGroup.upsert({
          where: { groupId: String(g.group_id) },
          update: {
            groupName: g.group_name,
            groupType: g.group_type ?? 1,
            status: g.status ?? 1,
            kindGroupJson: JSON.stringify(g.kind_group ?? []),
            modifyTime: g.modify_time ?? "",
            createTime: g.create_time ?? "",
            syncedAt: new Date(),
          },
          create: {
            groupId: String(g.group_id),
            groupName: g.group_name,
            groupType: g.group_type ?? 1,
            status: g.status ?? 1,
            kindGroupJson: JSON.stringify(g.kind_group ?? []),
            modifyTime: g.modify_time ?? "",
            createTime: g.create_time ?? "",
          },
        });
      }

      const catIds = (catResp.list ?? []).map((c) => String(c.category_id));
      await prisma.kamiCategory.deleteMany({
        where: catIds.length > 0 ? { categoryId: { notIn: catIds } } : {},
      });

      if ((kindResp.count ?? 0) <= 100) {
        const kindIds = (kindResp.list ?? []).map((k) => String(k.kind_id));
        await prisma.kamiKind.deleteMany({
          where: kindIds.length > 0 ? { kindId: { notIn: kindIds } } : {},
        });
      }

      if ((groupResp.count ?? 0) <= 50) {
        const groupIds = (groupResp.list ?? []).map((g) => String(g.group_id));
        await prisma.kamiGroup.deleteMany({
          where: groupIds.length > 0 ? { groupId: { notIn: groupIds } } : {},
        });
      }

      await writeSyncLog(
        "SYNC_KAMI",
        "Kami",
        "SUCCESS",
        `同步分类 ${(catResp.list ?? []).length} 个、卡种 ${(kindResp.list ?? []).length} 个、发卡组合 ${(groupResp.list ?? []).length} 个`
      );
      return ok({
        categories: catResp.list?.length ?? 0,
        kinds: kindResp.list?.length ?? 0,
        groups: groupResp.list?.length ?? 0,
      });
    }

    if (action === "createCategory") {
      const resp = await goofishApi.createKamiCategory(
        String(body.category_name),
        String(body.remark ?? "")
      );
      await prisma.kamiCategory.create({
        data: {
          categoryId: String(resp.category_id),
          categoryName: String(body.category_name),
          remark: String(body.remark ?? ""),
        },
      });
      return ok(resp);
    }

    if (action === "deleteCategory") {
      const ids = (body.category_ids as number[]).map(Number);
      await goofishApi.deleteKamiCategory(ids);
      await prisma.kamiCategory.deleteMany({
        where: { categoryId: { in: ids.map(String) } },
      });
      return ok({ deleted: ids.length });
    }

    if (action === "createKind") {
      const resp = await goofishApi.createKamiKind({
        kind_name: String(body.kind_name),
        kind_alias: body.kind_alias ? String(body.kind_alias) : "",
        kind_category: body.kind_category ? Number(body.kind_category) : undefined,
        kind_type: (Number(body.kind_type) === 2 ? 2 : 1) as 1 | 2,
        card_type: (Number(body.card_type) || 1) as 1 | 2 | 3 | 4 | 5,
        pwd_type: (Number(body.pwd_type) || 1) as 1 | 2 | 3,
        card_prefix: body.card_prefix ? String(body.card_prefix) : "",
        pwd_prefix: body.pwd_prefix ? String(body.pwd_prefix) : "",
        separator: (Number(body.separator) || 0) as 0 | 1 | 2 | 3 | 4,
        stock_warning: body.stock_warning ? Number(body.stock_warning) : 0,
        sort: body.sort ? Number(body.sort) : 0,
        cost: body.cost_fen ? Number(body.cost_fen) : 0,
      });
      return ok(resp);
    }

    if (action === "deleteKind") {
      const ids = (body.kind_ids as number[]).map(Number);
      await goofishApi.deleteKamiKind(ids);
      await prisma.kamiKind.deleteMany({
        where: { kindId: { in: ids.map(String) } },
      });
      return ok({ deleted: ids.length });
    }

    if (action === "editCategory") {
      await goofishApi.editKamiCategory(
        Number(body.category_id),
        String(body.category_name),
        String(body.remark ?? "")
      );
      await prisma.kamiCategory.updateMany({
        where: { categoryId: String(body.category_id) },
        data: {
          categoryName: String(body.category_name),
          remark: String(body.remark ?? ""),
        },
      });
      return ok({ updated: true });
    }

    if (action === "editKind") {
      const resp = await goofishApi.editKamiKind({
        kind_id: Number(body.kind_id),
        kind_name: String(body.kind_name),
        kind_alias: body.kind_alias ? String(body.kind_alias) : "",
        kind_category: body.kind_category ? Number(body.kind_category) : undefined,
        card_type: (Number(body.card_type) || 1) as 1 | 2 | 3 | 4 | 5,
        pwd_type: (Number(body.pwd_type) || 1) as 1 | 2 | 3,
        card_prefix: body.card_prefix ? String(body.card_prefix) : "",
        pwd_prefix: body.pwd_prefix ? String(body.pwd_prefix) : "",
        separator: (Number(body.separator) || 0) as 0 | 1 | 2 | 3 | 4,
        stock_warning: body.stock_warning ? Number(body.stock_warning) : 0,
        sort: body.sort ? Number(body.sort) : 0,
        cost: body.cost_fen ? Number(body.cost_fen) : 0,
      });
      return ok(resp);
    }

    if (action === "createGroup") {
      const resp = await goofishApi.createKamiGroup({
        group_name: String(body.group_name),
        group_type: (Number(body.group_type) === 2 ? 2 : 1) as 1 | 2,
        kind_group: body.kind_group,
      });
      return ok(resp);
    }

    if (action === "editGroup") {
      const resp = await goofishApi.editKamiGroup({
        group_id: Number(body.group_id),
        group_name: String(body.group_name),
        group_type: (Number(body.group_type) === 2 ? 2 : 1) as 1 | 2,
        kind_group: body.kind_group,
      });
      return ok(resp);
    }

    if (action === "updateGroupStatus") {
      const groupIds = (body.group_ids as number[]).map(Number);
      const status = (Number(body.status) === 2 ? 2 : 1) as 1 | 2;
      await goofishApi.updateKamiGroupStatus(groupIds, status);
      await prisma.kamiGroup.updateMany({
        where: { groupId: { in: groupIds.map(String) } },
        data: { status },
      });
      return ok({ updated: true });
    }

    if (action === "deleteGroup") {
      const groupIds = (body.group_ids as number[]).map(Number);
      await goofishApi.deleteKamiGroup(groupIds);
      await prisma.kamiGroup.deleteMany({
        where: { groupId: { in: groupIds.map(String) } },
      });
      return ok({ deleted: groupIds.length });
    }

    return fail("不支持的操作类型", 400);
  } catch (e) {
    return fail(e, 400);
  }
}
