import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { fail, ok, writeSyncLog } from "@/lib/api-helper";
import { goofishApi } from "@/lib/goofish/client";
import type { GoofishProductItem } from "@/lib/goofish/types";

async function upsertProduct(p: GoofishProductItem) {
  const rawSpecify = p.specify_publish_time as unknown;
  const specifyPublishTime =
    rawSpecify !== undefined && rawSpecify !== null && rawSpecify !== 0 && rawSpecify !== "0"
      ? String(rawSpecify)
      : "";

  const dataPayload = {
    title: String(p.title ?? ""),
    outerId: String(p.outer_id ?? ""),
    productStatus: Number(p.product_status ?? 0),
    publishStatus: Number(p.publish_status ?? 0),
    itemBizType: Number(p.item_biz_type ?? 0),
    spBizType: Number(p.sp_biz_type ?? 0),
    channelCatId: String(p.channel_cat_id ?? ""),
    channelPvJson: JSON.stringify(p.channel_pv ?? []),
    priceFen: Number(p.price ?? 0),
    originalPriceFen: Number(p.original_price ?? 0),
    expressFeeFen: Number(p.express_fee ?? 0),
    stock: Number(p.stock ?? 0),
    sold: Number(p.sold ?? 0),
    stuffStatus: Number(p.stuff_status ?? 0),
    skuItemsJson: JSON.stringify(p.sku_items ?? []),
    publishShopJson: JSON.stringify(p.publish_shop ?? []),
    specifyPublishTime,
    onlineTime: Number(p.online_time ?? 0),
    offlineTime: Number(p.offline_time ?? 0),
    createTime: Number(p.create_time ?? 0),
    updateTime: Number(p.update_time ?? 0),
  };

  await prisma.product.upsert({
    where: { productId: String(p.product_id) },
    update: {
      ...dataPayload,
      syncedAt: new Date(),
    },
    create: {
      productId: String(p.product_id),
      ...dataPayload,
    },
  });
}

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: [{ updateTime: "desc" }, { id: "desc" }],
    });
    return ok({ list: products });
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
      const maxPages = 20; // 最多 1000 条单次同步保护
      const seen = new Set<string>();
      let totalCount = 0;

      // 未传筛选时同时拉取默认全量及未上架(sale_status=1)、销售中(2)、已下架(3)，确保历史未上架商品完整同步
      const saleStatuses = body.sale_status
        ? [Number(body.sale_status)]
        : [undefined, 1, 2, 3];

      for (const sStatus of saleStatuses) {
        for (let pageNo = 1; pageNo <= maxPages; pageNo++) {
          const resp = await goofishApi.listProducts({
            page_no: pageNo,
            page_size: pageSize,
            ...(sStatus !== undefined ? { sale_status: sStatus } : {}),
            ...(body.product_status !== undefined
              ? { product_status: Number(body.product_status) }
              : {}),
          });
          const list = resp.list ?? [];
          totalCount = Math.max(totalCount, resp.count ?? 0);

          for (const p of list) {
            const key = String(p.product_id);
            if (!seen.has(key)) {
              seen.add(key);
              await upsertProduct(p);
            }
          }

          if (list.length < pageSize || pageNo * pageSize >= (resp.count ?? 0)) {
            break;
          }
        }
      }

      if (!body.sale_status && !body.product_status && seen.size >= totalCount) {
        const activeIds = Array.from(seen);
        await prisma.product.deleteMany({
          where: activeIds.length > 0 ? { productId: { notIn: activeIds } } : {},
        });
      }

      await writeSyncLog("SYNC_PRODUCTS", "Product", "SUCCESS", `全量同步商品 ${seen.size} 条`);
      return ok({ synced: seen.size, count: totalCount });
    }

    if (action === "publish") {
      const productId = Number(body.product_id);
      const userName = Array.isArray(body.user_name) ? body.user_name.map(String) : [];
      await goofishApi.publishProduct(productId, userName, {
        ...(body.specify_publish_time ? { specify_publish_time: String(body.specify_publish_time) } : {}),
        ...(body.notify_url ? { notify_url: String(body.notify_url) } : {}),
      });
      await prisma.product.updateMany({
        where: { productId: String(productId) },
        data: { publishStatus: 3 },
      });
      await writeSyncLog("PUBLISH_PRODUCT", String(productId), "SUCCESS", `发起上架商品 ${productId}`);
      return ok({ published: true });
    }

    if (action === "downShelf") {
      const productId = Number(body.product_id);
      await goofishApi.downShelfProduct(productId);
      await prisma.product.updateMany({
        where: { productId: String(productId) },
        data: { publishStatus: 4 },
      });
      await writeSyncLog("DOWNSHELF_PRODUCT", String(productId), "SUCCESS", `下架商品 ${productId}`);
      return ok({ downShelf: true });
    }

    if (action === "editStock") {
      const productId = Number(body.product_id);
      const stock = Number(body.stock);
      await goofishApi.editProductStock({
        product_id: productId,
        stock,
        ...(Array.isArray(body.sku_items) ? { sku_items: body.sku_items } : {}),
      });
      await prisma.product.updateMany({
        where: { productId: String(productId) },
        data: { stock },
      });
      return ok({ updated: true });
    }

    if (action === "linkKami") {
      const productId = String(body.product_id);
      const updated = await prisma.product.update({
        where: { productId },
        data: {
          linkedKindId: body.linked_kind_id ? String(body.linked_kind_id) : null,
          linkedGroupId: body.linked_group_id ? String(body.linked_group_id) : null,
          localCostFen:
            body.local_cost_fen !== undefined && body.local_cost_fen !== null
              ? Number(body.local_cost_fen)
              : null,
        },
      });
      return ok(updated);
    }

    if (action === "categories") {
      const itemBizType = Number(body.item_biz_type || 2);
      const spBizType = body.sp_biz_type ? Number(body.sp_biz_type) : undefined;
      const resp = await goofishApi.listProductCategories(itemBizType, spBizType);
      return ok({ list: resp.list ?? [] });
    }

    if (action === "pvs") {
      const resp = await goofishApi.listProductPv(
        Number(body.item_biz_type || 2),
        Number(body.sp_biz_type || 1),
        String(body.channel_cat_id)
      );
      return ok({ list: resp.list ?? [] });
    }

    if (action === "skus") {
      const ids = (body.product_ids as number[]).map(Number);
      const resp = await goofishApi.listProductSkus(ids);
      return ok({ list: resp.list ?? [] });
    }

    if (action === "detail") {
      const productId = Number(body.product_id);
      const detail = await goofishApi.getProductDetail(productId);
      await upsertProduct(detail);
      return ok(detail);
    }

    if (action === "create") {
      const resp = await goofishApi.createProduct({
        item_biz_type: Number(body.item_biz_type || 2),
        sp_biz_type: Number(body.sp_biz_type || 1),
        channel_cat_id: String(body.channel_cat_id),
        ...(Array.isArray(body.channel_pv) && body.channel_pv.length > 0
          ? { channel_pv: body.channel_pv }
          : {}),
        price: Number(body.price),
        original_price: body.original_price ? Number(body.original_price) : Number(body.price),
        express_fee: Number(body.express_fee || 0),
        stock: Number(body.stock || 1),
        outer_id: body.outer_id ? String(body.outer_id) : undefined,
        stuff_status: Number(body.stuff_status ?? 100),
        publish_shop: body.publish_shop,
        ...(Array.isArray(body.sku_items) && body.sku_items.length > 0
          ? { sku_items: body.sku_items }
          : {}),
        ...(body.specify_publish_time
          ? { specify_publish_time: String(body.specify_publish_time) }
          : {}),
        ...(body.notify_url ? { notify_url: String(body.notify_url) } : {}),
      });
      await writeSyncLog("CREATE_PRODUCT", String(resp.product_id), "SUCCESS", `创建商品 ${resp.product_id}`);
      return ok(resp);
    }

    if (action === "edit") {
      const productId = Number(body.product_id);
      const resp = await goofishApi.editProduct({
        product_id: productId,
        ...(body.item_biz_type !== undefined ? { item_biz_type: Number(body.item_biz_type) } : {}),
        ...(body.sp_biz_type !== undefined ? { sp_biz_type: Number(body.sp_biz_type) } : {}),
        ...(body.channel_cat_id ? { channel_cat_id: String(body.channel_cat_id) } : {}),
        ...(Array.isArray(body.channel_pv) ? { channel_pv: body.channel_pv } : {}),
        ...(body.price !== undefined ? { price: Number(body.price) } : {}),
        ...(body.original_price !== undefined ? { original_price: Number(body.original_price) } : {}),
        ...(body.express_fee !== undefined ? { express_fee: Number(body.express_fee) } : {}),
        ...(body.stock !== undefined ? { stock: Number(body.stock) } : {}),
        ...(body.outer_id !== undefined ? { outer_id: String(body.outer_id) } : {}),
        ...(body.stuff_status !== undefined ? { stuff_status: Number(body.stuff_status) } : {}),
        ...(Array.isArray(body.publish_shop) ? { publish_shop: body.publish_shop } : {}),
        ...(Array.isArray(body.sku_items) && body.sku_items.length > 0
          ? { sku_items: body.sku_items }
          : {}),
        ...(body.specify_publish_time !== undefined
          ? { specify_publish_time: String(body.specify_publish_time) }
          : {}),
        ...(body.notify_url ? { notify_url: String(body.notify_url) } : {}),
      });
      await writeSyncLog("EDIT_PRODUCT", String(productId), "SUCCESS", `编辑商品 ${productId}`);
      return ok(resp);
    }

    if (action === "delete") {
      const productId = Number(body.product_id);
      await goofishApi.deleteProduct(productId);
      await prisma.product.deleteMany({ where: { productId: String(productId) } });
      await writeSyncLog("DELETE_PRODUCT", String(productId), "SUCCESS", `删除商品 ${productId}`);
      return ok({ deleted: true });
    }

    return fail("不支持的操作类型", 400);
  } catch (e) {
    return fail(e, 400);
  }
}
