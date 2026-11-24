import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import type {
  GoofishCategoryItem,
  GoofishCredentials,
  GoofishDummySendReq,
  GoofishEditStockReq,
  GoofishKamiCategory,
  GoofishKamiGroup,
  GoofishKamiGroupWriteReq,
  GoofishKamiKind,
  GoofishKamiKindCreateReq,
  GoofishKamiKindEditReq,
  GoofishKamiStorageCreateReq,
  GoofishOrderItem,
  GoofishOrderKamItem,
  GoofishOrderListReq,
  GoofishProductCreateReq,
  GoofishProductEditReq,
  GoofishProductItem,
  GoofishProductListReq,
  GoofishRefundItem,
  GoofishRefundListReq,
  GoofishRefundRefusedReq,
  GoofishResponse,
  GoofishShopItem,
} from "./types";

const DEFAULT_BASE_URL = "https://open.goofish.pro";

// 官方QPS限流保护：单账号全接口总和 <= 10次/秒，间隔 >= 115ms
let queueTail: Promise<void> = Promise.resolve();
let lastCallAt = 0;

async function throttleQps(): Promise<void> {
  const prev = queueTail;
  let release!: () => void;
  queueTail = new Promise<void>((r) => {
    release = r;
  });
  await prev;
  try {
    const now = Date.now();
    const waitMs = Math.max(0, 115 - (now - lastCallAt));
    if (waitMs > 0) {
      await new Promise((r) => setTimeout(r, waitMs));
    }
    lastCallAt = Date.now();
  } finally {
    release();
  }
}

function md5(input: string): string {
  return crypto.createHash("md5").update(input, "utf8").digest("hex");
}

/**
 * 严格遵循 docs/goofish-api.md 的 MD5 签名规则：
 * - bodyMd5 = md5(bodyString)（无参数传 "{}"）
 * - 自研模式：md5(`${appKey},${bodyMd5},${timestamp},${appSecret}`)
 * - 商务对接模式：md5(`${appKey},${bodyMd5},${timestamp},${sellerId},${appSecret}`)
 */
export function generateGoofishSign(
  creds: GoofishCredentials,
  bodyString: string,
  timestamp: number
): string {
  const bodyMd5 = md5(bodyString);
  const raw = creds.sellerId?.trim()
    ? `${creds.appKey},${bodyMd5},${timestamp},${creds.sellerId.trim()},${creds.appSecret}`
    : `${creds.appKey},${bodyMd5},${timestamp},${creds.appSecret}`;
  return md5(raw);
}

/**
 * 推送回调验签（无 seller_id，按自研规则：md5(appKey,bodyMd5,timestamp,appSecret)）
 */
export async function verifyGoofishWebhookSign(
  bodyString: string,
  timestamp: string | null,
  sign: string | null
): Promise<boolean> {
  if (!timestamp || !sign) return true; // 若平台未传或仅本地测试
  const creds = await getGoofishCredentials().catch(() => null);
  if (!creds) return false;
  const bodyMd5 = md5(bodyString);
  const expected = md5(`${creds.appKey},${bodyMd5},${timestamp},${creds.appSecret}`);
  return expected.toLowerCase() === sign.toLowerCase();
}

export async function getGoofishCredentials(): Promise<GoofishCredentials> {
  const rows = await prisma.appSetting.findMany({
    where: {
      key: { in: ["goofish_app_key", "goofish_app_secret", "goofish_seller_id", "goofish_base_url"] },
    },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const appKey = map.get("goofish_app_key") || process.env.GOOFISH_APP_KEY || "";
  const appSecret = map.get("goofish_app_secret") || process.env.GOOFISH_APP_SECRET || "";
  const sellerId = map.get("goofish_seller_id") || process.env.GOOFISH_SELLER_ID || "";
  const baseUrl = map.get("goofish_base_url") || process.env.GOOFISH_BASE_URL || DEFAULT_BASE_URL;

  if (!appKey || !appSecret) {
    throw new Error("未配置闲管家 AppKey / AppSecret，请先在「系统设置」中填写并保存。");
  }

  return { appKey, appSecret, sellerId: sellerId || undefined, baseUrl };
}

export async function callGoofishApi<TReq extends object, TResp>(
  path: string,
  body: TReq,
  overrideCreds?: GoofishCredentials
): Promise<TResp> {
  const creds = overrideCreds ?? (await getGoofishCredentials());
  const baseUrl = (creds.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, "");
  const timestamp = Math.floor(Date.now() / 1000);
  const bodyString = JSON.stringify(body ?? {});
  const sign = generateGoofishSign(creds, bodyString, timestamp);

  const params = new URLSearchParams({
    appid: creds.appKey,
    timestamp: String(timestamp),
    sign,
  });
  if (creds.sellerId?.trim()) {
    params.set("seller_id", creds.sellerId.trim());
  }

  const url = `${baseUrl}${path}?${params.toString()}`;
  await throttleQps();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: bodyString,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`闲管家 HTTP 异常 (${res.status}): ${text}`);
  }

  const json = (await res.json()) as GoofishResponse<TResp>;
  if (json.code !== 0) {
    throw new Error(`闲管家接口报错 [${json.code}]: ${json.msg}`);
  }

  return json.data;
}

/**
 * 闲管家官方接口客户端（所有 Path 与参数严格对应 docs/goofish-api.md）
 */
export const goofishApi = {
  // 用户
  listShops: (creds?: GoofishCredentials) =>
    callGoofishApi<Record<string, never>, { list: GoofishShopItem[] }>(
      "/api/open/user/authorize/list",
      {},
      creds
    ),

  // 商品
  listProducts: (req: GoofishProductListReq) =>
    callGoofishApi<
      GoofishProductListReq,
      { list: GoofishProductItem[]; count: number; page_no: number; page_size: number }
    >("/api/open/product/list", req),

  getProductDetail: (productId: number) =>
    callGoofishApi<{ product_id: number }, GoofishProductItem>(
      "/api/open/product/detail",
      { product_id: productId }
    ),

  publishProduct: (
    productId: number,
    userName: string[],
    options?: { specify_publish_time?: string; notify_url?: string }
  ) =>
    callGoofishApi<
      {
        product_id: number;
        user_name: string[];
        specify_publish_time?: string;
        notify_url?: string;
      },
      Record<string, unknown>
    >("/api/open/product/publish", {
      product_id: productId,
      user_name: userName,
      ...(options?.specify_publish_time ? { specify_publish_time: options.specify_publish_time } : {}),
      ...(options?.notify_url ? { notify_url: options.notify_url } : {}),
    }),

  downShelfProduct: (productId: number) =>
    callGoofishApi<{ product_id: number }, Record<string, unknown>>(
      "/api/open/product/downShelf",
      { product_id: productId }
    ),

  editProductStock: (req: GoofishEditStockReq) =>
    callGoofishApi<GoofishEditStockReq, Record<string, unknown>>(
      "/api/open/product/edit/stock",
      req
    ),

  listProductCategories: (itemBizType: number, spBizType?: number) =>
    callGoofishApi<
      { item_biz_type: number; sp_biz_type?: number },
      { list: GoofishCategoryItem[] }
    >("/api/open/product/category/list", {
      item_biz_type: itemBizType,
      ...(spBizType !== undefined ? { sp_biz_type: spBizType } : {}),
    }),

  listProductPv: (itemBizType: number, spBizType: number, channelCatId: string) =>
    callGoofishApi<
      { item_biz_type: number; sp_biz_type: number; channel_cat_id: string },
      { list: unknown[] }
    >("/api/open/product/pv/list", {
      item_biz_type: itemBizType,
      sp_biz_type: spBizType,
      channel_cat_id: channelCatId,
    }),

  createProduct: (req: GoofishProductCreateReq) =>
    callGoofishApi<GoofishProductCreateReq, { product_id: number; product_status?: number }>(
      "/api/open/product/create",
      req
    ),

  editProduct: (req: GoofishProductEditReq) =>
    callGoofishApi<GoofishProductEditReq, { product_id?: number }>(
      "/api/open/product/edit",
      req
    ),

  deleteProduct: (productId: number) =>
    callGoofishApi<{ product_id: number }, Record<string, unknown>>(
      "/api/open/product/delete",
      { product_id: productId }
    ),

  listProductSkus: (productIds: number[]) =>
    callGoofishApi<{ product_id: number[] }, { list: unknown[] }>(
      "/api/open/product/sku/list",
      { product_id: productIds }
    ),

  // 订单
  listOrders: (req: GoofishOrderListReq) =>
    callGoofishApi<
      GoofishOrderListReq,
      { list: GoofishOrderItem[]; count: number; page_no: number; page_size: number }
    >("/api/open/order/list", req),

  getOrderDetail: (orderNo: string) =>
    callGoofishApi<{ order_no: string }, GoofishOrderItem>(
      "/api/open/order/detail",
      { order_no: orderNo }
    ),

  modifyOrderPrice: (orderNo: string, orderPrice: number, expressFee = 0) =>
    callGoofishApi<
      { order_no: string; order_price: number; express_fee: number },
      Record<string, unknown>
    >("/api/open/order/modify/price", {
      order_no: orderNo,
      order_price: orderPrice,
      express_fee: expressFee,
    }),

  dummySendOrder: (req: GoofishDummySendReq) =>
    callGoofishApi<GoofishDummySendReq, Record<string, unknown>>(
      "/api/open/trade/logistics/dummy/send",
      req
    ),

  listOrderKams: (orderNo: string) =>
    callGoofishApi<{ order_no: string }, { list: GoofishOrderKamItem[] }>(
      "/api/open/order/kam/list",
      { order_no: orderNo }
    ),

  // 售后
  listRefunds: (req: GoofishRefundListReq) =>
    callGoofishApi<
      GoofishRefundListReq,
      { list: GoofishRefundItem[]; has_next_page: boolean }
    >("/api/open/trade/refund/list", req),

  getRefundDetail: (orderNo: string) =>
    callGoofishApi<{ order_no: string }, GoofishRefundItem>(
      "/api/open/trade/refund/detail",
      { order_no: orderNo }
    ),

  agreeRefund: (orderNo: string, returnExplain?: string) =>
    callGoofishApi<
      { order_no: string; return_explain?: string },
      Record<string, unknown>
    >("/api/open/trade/refund/operate/agree", {
      order_no: orderNo,
      ...(returnExplain ? { return_explain: returnExplain } : {}),
    }),

  refuseRefund: (req: GoofishRefundRefusedReq) =>
    callGoofishApi<GoofishRefundRefusedReq, Record<string, unknown>>(
      "/api/open/trade/refund/operate/refused",
      req
    ),

  // 卡密分类
  listKamiCategories: () =>
    callGoofishApi<Record<string, never>, { list: GoofishKamiCategory[]; count: number }>(
      "/api/open/kami/category/list",
      {}
    ),

  createKamiCategory: (categoryName: string, remark: string) =>
    callGoofishApi<
      { category_name: string; remark: string },
      { category_id: number }
    >("/api/open/kami/category/create", { category_name: categoryName, remark }),

  editKamiCategory: (categoryId: number, categoryName: string, remark: string) =>
    callGoofishApi<
      { category_id: number; category_name: string; remark: string },
      Record<string, unknown>
    >("/api/open/kami/category/edit", {
      category_id: categoryId,
      category_name: categoryName,
      remark,
    }),

  deleteKamiCategory: (categoryIds: number[]) =>
    callGoofishApi<{ category_id: number[] }, Record<string, unknown>>(
      "/api/open/kami/category/delete",
      { category_id: categoryIds }
    ),

  // 卡种
  listKamiKinds: (req: {
    kind_name?: string;
    kind_category?: number;
    kind_type?: 1 | 2;
    page_no?: number;
    page_size?: number;
  }) =>
    callGoofishApi<typeof req, { list: GoofishKamiKind[]; count: number }>(
      "/api/open/kami/kind/list",
      req
    ),

  createKamiKind: (req: GoofishKamiKindCreateReq) =>
    callGoofishApi<GoofishKamiKindCreateReq, { kind_id: number }>(
      "/api/open/kami/kind/create",
      req
    ),

  getKamiKindInfo: (kindId: number) =>
    callGoofishApi<{ kind_id: number }, GoofishKamiKind>(
      "/api/open/kami/kind/info",
      { kind_id: kindId }
    ),

  editKamiKind: (req: GoofishKamiKindEditReq) =>
    callGoofishApi<GoofishKamiKindEditReq, { kind_id: number }>(
      "/api/open/kami/kind/edit",
      req
    ),

  deleteKamiKind: (kindIds: number[]) =>
    callGoofishApi<{ kind_id: number[] }, Record<string, unknown>>(
      "/api/open/kami/kind/delete",
      { kind_id: kindIds }
    ),

  // 卡密库存添加
  createKamiStorage: (req: GoofishKamiStorageCreateReq) =>
    callGoofishApi<GoofishKamiStorageCreateReq, Record<string, unknown>>(
      "/api/open/kami/storage/create",
      req
    ),

  // 发卡组合
  listKamiGroups: (req: {
    group_name?: string;
    group_type?: 1 | 2;
    status?: 1 | 2;
    page_no: number;
    page_size: number;
  }) =>
    callGoofishApi<typeof req, { list: GoofishKamiGroup[]; count: number }>(
      "/api/open/kami/group/list",
      req
    ),

  createKamiGroup: (req: GoofishKamiGroupWriteReq) =>
    callGoofishApi<GoofishKamiGroupWriteReq, { group_id: number }>(
      "/api/open/kami/group/create",
      req
    ),

  editKamiGroup: (req: GoofishKamiGroupWriteReq & { group_id: number }) =>
    callGoofishApi<GoofishKamiGroupWriteReq & { group_id: number }, { group_id: number }>(
      "/api/open/kami/group/edit",
      req
    ),

  updateKamiGroupStatus: (groupIds: number[], status: 1 | 2) =>
    callGoofishApi<{ group_id: number[]; status: 1 | 2 }, Record<string, unknown>>(
      "/api/open/kami/group/update/status",
      { group_id: groupIds, status }
    ),

  deleteKamiGroup: (groupIds: number[]) =>
    callGoofishApi<{ group_id: number[] }, Record<string, unknown>>(
      "/api/open/kami/group/delete",
      { group_id: groupIds }
    ),
};
