export function fenToYuan(fen: number | null | undefined): string {
  const n = Number(fen ?? 0) / 100;
  return `¥${n.toFixed(2)}`;
}

export function unixToStr(ts: number | null | undefined): string {
  if (!ts || ts <= 0) return "-";
  return new Date(ts * 1000).toLocaleString("zh-CN", {
    hour12: false,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const PUBLISH_STATUS_MAP: Record<
  number,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  [-1]: { label: "不可操作", variant: "outline" },
  1: { label: "草稿箱", variant: "secondary" },
  2: { label: "待发布", variant: "outline" },
  3: { label: "销售中", variant: "default" },
  4: { label: "已下架", variant: "secondary" },
  5: { label: "已售罄", variant: "destructive" },
  9: { label: "商品异常", variant: "destructive" },
};

export const PRODUCT_STATUS_MAP: Record<
  number,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  [-1]: { label: "已删除", variant: "outline" },
  21: { label: "待发布", variant: "outline" },
  22: { label: "销售中", variant: "default" },
  23: { label: "已售罄", variant: "destructive" },
  31: { label: "手动下架", variant: "secondary" },
  33: { label: "售出下架", variant: "secondary" },
  36: { label: "自动下架", variant: "secondary" },
};

export function getProductDisplayStatus(
  productStatus: number,
  publishStatus: number,
  errorMsg?: string
): {
  bucket: "DRAFT" | "ON_SALE" | "OFF_SHELF" | "ERROR" | "OTHER";
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} {
  if (publishStatus === 9 || Boolean(errorMsg)) {
    return { bucket: "ERROR", label: "商品异常", variant: "destructive" };
  }
  if (productStatus === 22 || publishStatus === 3) {
    return { bucket: "ON_SALE", label: "销售中", variant: "default" };
  }
  if (productStatus === 21 || publishStatus === 1 || publishStatus === 2) {
    const label = publishStatus === 1 ? "草稿箱" : "待发布";
    return { bucket: "DRAFT", label, variant: "outline" };
  }
  if (
    productStatus === 23 ||
    productStatus === 31 ||
    productStatus === 33 ||
    productStatus === 36 ||
    publishStatus === 4 ||
    publishStatus === 5
  ) {
    const meta =
      PRODUCT_STATUS_MAP[productStatus] ??
      PUBLISH_STATUS_MAP[publishStatus] ?? { label: "已下架", variant: "secondary" as const };
    return { bucket: "OFF_SHELF", ...meta };
  }
  return { bucket: "OTHER", label: String(productStatus || publishStatus), variant: "outline" };
}

export const ITEM_BIZ_TYPE_OPTIONS = [
  { value: "2", label: "普通商品" },
  { value: "0", label: "已验货" },
  { value: "10", label: "验货宝" },
  { value: "16", label: "品牌授权" },
  { value: "19", label: "闲鱼严选" },
  { value: "24", label: "闲鱼特卖" },
  { value: "26", label: "品牌捡漏" },
  { value: "35", label: "跨境商品" },
];

export const SP_BIZ_TYPE_OPTIONS = [
  { value: "25", label: "卡券" },
  { value: "22", label: "虚拟游戏" },
  { value: "23", label: "租号" },
  { value: "20", label: "游戏电玩" },
  { value: "9", label: "3C数码" },
  { value: "1", label: "手机" },
  { value: "2", label: "潮品" },
  { value: "3", label: "家电" },
  { value: "8", label: "乐器" },
  { value: "16", label: "奢品" },
  { value: "17", label: "母婴" },
  { value: "18", label: "美妆个护" },
  { value: "19", label: "文玩/珠宝" },
  { value: "21", label: "家居" },
  { value: "24", label: "图书" },
  { value: "27", label: "食品" },
  { value: "28", label: "潮玩" },
  { value: "29", label: "二手车" },
  { value: "30", label: "宠植" },
  { value: "31", label: "工艺礼品" },
  { value: "33", label: "汽车服务" },
  { value: "99", label: "其他" },
];

export const STUFF_STATUS_OPTIONS = [
  { value: "0", label: "无成色" },
  { value: "100", label: "全新" },
  { value: "-1", label: "准新" },
  { value: "99", label: "99新" },
  { value: "95", label: "95新" },
  { value: "90", label: "9新" },
  { value: "80", label: "8新" },
  { value: "70", label: "7新" },
  { value: "60", label: "6新" },
  { value: "50", label: "5新及以下" },
];

export const SERVICE_SUPPORT_OPTIONS = [
  { value: "NONE", label: "无" },
  { value: "SDR", label: "七天无理由退货 (SDR)" },
  { value: "NFR", label: "描述不符包邮退 (NFR)" },
  { value: "VNR", label: "描述不符全额退·虚拟类 (VNR)" },
  { value: "FD_10MS", label: "10分钟极速发货·虚拟类 (FD_10MS)" },
  { value: "FD_24HS", label: "24小时极速发货 (FD_24HS)" },
  { value: "FD_48HS", label: "48小时极速发货 (FD_48HS)" },
];

export const ORDER_STATUS_MAP: Record<
  number,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  11: { label: "待付款", variant: "outline" },
  12: { label: "待发货(旧)", variant: "secondary" },
  21: { label: "待付款", variant: "outline" },
  22: { label: "待发货", variant: "default" },
  23: { label: "已发货", variant: "secondary" },
  24: { label: "交易成功", variant: "default" },
  31: { label: "已关闭", variant: "outline" },
  32: { label: "已关闭", variant: "outline" },
  33: { label: "已关闭", variant: "outline" },
};

export const REFUND_STATUS_MAP: Record<
  number,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  0: { label: "未申请退款", variant: "outline" },
  1: { label: "待商家处理", variant: "destructive" },
  2: { label: "待买家退货", variant: "secondary" },
  3: { label: "待商家收货", variant: "default" },
  4: { label: "退款关闭", variant: "outline" },
  5: { label: "退款成功", variant: "secondary" },
  6: { label: "已拒绝退款", variant: "outline" },
  8: { label: "待确认退货地址", variant: "destructive" },
};
