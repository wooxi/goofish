export interface GoofishResponse<T = Record<string, unknown>> {
  code: number;
  msg: string;
  data: T;
}

export interface GoofishCredentials {
  appKey: string;
  appSecret: string;
  sellerId?: string;
  baseUrl?: string;
}

// 1. 用户 - 查询闲鱼店铺 (/api/open/user/authorize/list)
export interface GoofishShopItem {
  authorize_id: number;
  authorize_expires: number;
  user_id?: number;
  user_identity: string;
  user_name: string;
  user_nick: string;
  shop_name: string;
  service_support: string;
  is_deposit_enough: boolean;
  is_pro: boolean;
  is_valid: boolean;
  is_trial: boolean;
  valid_end_time: number;
  item_biz_types: string;
}

// 2. 商品 - 查询商品列表 (/api/open/product/list)
export interface GoofishProductListReq {
  online_time?: [number, number];
  offline_time?: [number, number];
  sold_time?: [number, number];
  update_time?: [number, number];
  create_time?: [number, number];
  product_status?: number;
  sale_status?: number;
  page_no?: number;
  page_size?: number;
}

export interface GoofishSkuItem {
  sku_id: number;
  price: number;
  stock: number;
  sku_text: string;
  outer_id?: string;
  xy_sku_id?: number;
}

export interface GoofishPublishShop {
  item_id?: number;
  user_name: string;
  province: number;
  city: number;
  district: number;
  title: string;
  content: string;
  images: string[];
  white_images?: string;
  service_support?: string;
  status: number;
}

export interface GoofishProductItem {
  product_id: number;
  product_status: number;
  item_biz_type: number;
  sp_biz_type: number;
  channel_cat_id: string;
  channel_pv?: GoofishChannelPvItem[];
  title: string;
  price: number;
  original_price?: number;
  express_fee?: number;
  stock: number;
  sold?: number;
  outer_id?: string;
  stuff_status?: number;
  publish_status: number;
  publish_shop?: GoofishPublishShop[];
  sku_items?: GoofishSkuItem[];
  specify_publish_time?: string;
  online_time?: number;
  offline_time?: number;
  sold_time?: number;
  create_time?: number;
  update_time?: number;
}

// 3. 商品 - 编辑库存 (/api/open/product/edit/stock)
export interface GoofishEditStockReq {
  product_id: number;
  stock: number;
  sku_items?: Array<{
    sku_id: number;
    stock: number;
    price?: number;
  }>;
}

export interface GoofishCategoryItem {
  channel_cat_id: string;
  channel_cat_name: string;
  item_biz_type?: number;
  sp_biz_type?: number;
}

export interface GoofishChannelPvItem {
  property_id: string;
  property_name: string;
  value_id: string;
  value_name: string;
}

export interface GoofishProductCreateReq {
  item_biz_type: number;
  sp_biz_type: number;
  channel_cat_id: string;
  channel_pv?: GoofishChannelPvItem[];
  price: number;
  original_price?: number;
  express_fee?: number;
  stock: number;
  outer_id?: string;
  stuff_status: number;
  publish_shop: Array<{
    user_name: string;
    province: number;
    city: number;
    district: number;
    title: string;
    content: string;
    images: string[];
    white_images?: string;
    service_support?: string;
    status?: number;
  }>;
  sku_items?: Array<{
    sku_id?: number;
    price: number;
    stock: number;
    outer_id?: string;
    sku_text: string;
  }>;
  specify_publish_time?: string;
  notify_url?: string;
}

export interface GoofishProductEditReq extends Partial<GoofishProductCreateReq> {
  product_id: number;
}

// 4. 订单 - 查询订单列表 (/api/open/order/list)
export interface GoofishOrderListReq {
  authorize_id?: number;
  order_status?: number;
  refund_status?: number;
  pay_time?: [number, number];
  consign_time?: [number, number];
  confirm_time?: [number, number];
  refund_time?: [number, number];
  update_time?: [number, number];
  page_no?: number;
  page_size?: number;
}

export interface GoofishOrderGoods {
  quantity: number;
  price: number;
  product_id: number;
  item_id: number;
  outer_id?: string;
  sku_id: number;
  sku_outer_id?: string;
  sku_text?: string;
  title: string;
  images?: string[];
  service_support?: string;
}

export interface GoofishOrderItem {
  order_no: string;
  order_status: number;
  order_time?: number;
  total_amount: number;
  pay_amount: number;
  pay_no?: string;
  pay_time: number;
  refund_status: number;
  refund_time?: number;
  express_fee?: number;
  consign_type?: number;
  consign_time?: number;
  confirm_time?: number;
  cancel_reason?: string;
  cancel_time?: number;
  create_time: number;
  update_time: number;
  buyer_eid: string;
  buyer_nick: string;
  seller_eid: string;
  seller_name: string;
  seller_remark?: string;
  goods: GoofishOrderGoods;
}

// 5. 订单 - 无需物流发货 (/api/open/trade/logistics/dummy/send)
export interface GoofishDummySendReq {
  order_no: string;
  send_way: 1 | 2; // 1: 仅更新订单状态; 2: 发卡密并更新订单状态
}

// 6. 售后 - 售后订单列表 (/api/open/trade/refund/list)
export interface GoofishRefundListReq {
  order_no?: string;
  authorize_id?: number;
  apply_time?: [number, number];
  refund_time?: [number, number];
  refund_type?: 1 | 2;
  refund_status?: number;
  page_no?: number;
  page_size?: number;
}

export interface GoofishRefundItem {
  refund_no: string;
  order_no: string;
  seller_eid: string;
  seller_name: string;
  goods_status: number;
  refund_type: number;
  refund_status: number;
  refund_amount: number;
  apply_amount: number;
  refund_time: number;
  apply_time: number;
  timeout_time: number;
  timeout_status: number;
  timeout_type: number;
  waybill_no: string;
  express_code: string;
  reject_time: number;
  refund_reason: string;
}

// 7. 卡密 - 分类 / 组合 / 卡种 / 添加库存
export interface GoofishKamiCategory {
  category_id: number;
  category_name: string;
  remark: string;
  create_time: string;
  update_time: string;
}

export interface GoofishKamiKind {
  kind_id: number;
  kind_name: string;
  kind_alias: string;
  kind_category: number;
  kind_category_name: string;
  kind_type: 1 | 2;
  cost: string;
  avg_cost: string;
  stock: number;
  sold: number;
  total_cost: string;
  total_stock: number;
  card_type: number;
  pwd_type: number;
  card_prefix: string;
  pwd_prefix: string;
  priority_sale: number;
  priority_sale_name: string;
  separator: number;
  separator_name: string;
  stock_warning: number;
  sort: number;
  modify_time: string;
  create_time: string;
}

export interface GoofishKamiKindCreateReq {
  kind_name: string;
  kind_alias?: string;
  kind_category?: number;
  kind_type: 1 | 2;
  card_type: 1 | 2 | 3 | 4 | 5;
  pwd_type?: 1 | 2 | 3;
  card_prefix?: string;
  pwd_prefix?: string;
  separator?: 0 | 1 | 2 | 3 | 4;
  stock_warning?: number;
  sort?: number;
  cost?: number;
}

export interface GoofishKamiStorageCreateReq {
  kind_id: number;
  cost: number; // 分
  is_cover: boolean;
  is_repeat: boolean;
  is_priority: boolean;
  cards: Array<{
    card_no: string;
    card_pwd: string;
  }>;
}

export interface GoofishKamiGroup {
  group_id: number;
  group_name: string;
  group_type: 1 | 2;
  status: 1 | 2;
  kind_group: Array<{
    items: Array<{
      kind_id: number;
      multiple: number;
    }>;
    quantity?: number;
  }>;
  modify_time: string;
  create_time: string;
}

export interface GoofishKamiKindEditReq {
  kind_id: number;
  kind_name: string;
  kind_alias?: string;
  kind_category?: number;
  card_type: 1 | 2 | 3 | 4 | 5;
  pwd_type?: 1 | 2 | 3;
  card_prefix?: string;
  pwd_prefix?: string;
  separator?: 0 | 1 | 2 | 3 | 4;
  stock_warning?: number;
  sort?: number;
  cost?: number;
}

export interface GoofishKamiGroupWriteReq {
  group_id?: number;
  group_name: string;
  group_type: 1 | 2;
  kind_group: Array<{
    items: Array<{ kind_id: number; multiple: number }>;
    quantity?: number;
  }>;
}

export interface GoofishOrderKamItem {
  card_no: string;
  card_pwd: string;
  cost: number; // 分
  sold_type: 11 | 12 | 21 | 22;
}

export interface GoofishRefundRefusedReq {
  order_no: string;
  refuse_reason: string;
  refuse_explain?: string;
  refuse_images?: Array<{
    size: number;
    src: string;
    width?: number;
    height?: number;
  }>;
}
