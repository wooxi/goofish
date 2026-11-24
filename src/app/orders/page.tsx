"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { RefreshCw, Send, DollarSign, Eye } from "lucide-react";
import { fenToYuan, ORDER_STATUS_MAP, unixToStr } from "@/lib/format";

interface OrderRow {
  id: number;
  orderNo: string;
  authorizeId: string;
  buyerNick: string;
  sellerName: string;
  productTitle: string;
  buyNum: number;
  orderStatus: number;
  refundStatus: number;
  payAmountFen: number;
  costFen: number;
  profitFen: number;
  createTime: number;
}

interface ShopOption {
  authorizeId: string;
  shopName: string;
  userName: string;
}

interface OrderKamItem {
  card_no: string;
  card_pwd: string;
  cost: number;
  sold_type: number;
}

const SOLD_TYPE_MAP: Record<number, string> = {
  11: "自动发货",
  12: "手动发货",
  21: "手动提卡",
  22: "手动标识已售",
};

export default function OrdersPage() {
  const [list, setList] = React.useState<OrderRow[]>([]);
  const [shops, setShops] = React.useState<ShopOption[]>([]);
  const [syncing, setSyncing] = React.useState(false);
  const [statusTab, setStatusTab] = React.useState("ALL");
  const [selectedShop, setSelectedShop] = React.useState("ALL");

  const [sendOpen, setSendOpen] = React.useState(false);
  const [activeOrder, setActiveOrder] = React.useState<OrderRow | null>(null);
  const [sendWay, setSendWay] = React.useState<1 | 2>(2);

  const [priceOpen, setPriceOpen] = React.useState(false);
  const [newPriceYuan, setNewPriceYuan] = React.useState("0");

  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [detailData, setDetailData] = React.useState<Record<string, unknown> | null>(null);
  const [kamList, setKamList] = React.useState<OrderKamItem[]>([]);

  const load = React.useCallback(async () => {
    const [oRes, sRes] = await Promise.all([fetch("/api/orders"), fetch("/api/shops")]);
    const oJson = await oRes.json();
    const sJson = await sRes.json();
    if (oJson.ok) setList(oJson.data.list);
    if (sJson.ok) setShops(sJson.data.list);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const filteredList = React.useMemo(() => {
    return list.filter((o) => {
      if (selectedShop !== "ALL") {
        const shop = shops.find((s) => s.authorizeId === selectedShop);
        const matchAuth = o.authorizeId === selectedShop;
        const matchSeller = shop ? o.sellerName === shop.userName || o.sellerName === shop.shopName : false;
        if (!matchAuth && !matchSeller) return false;
      }
      if (statusTab === "UNPAID") return o.orderStatus === 11 || o.orderStatus === 21;
      if (statusTab === "TO_SHIP") return o.orderStatus === 22;
      if (statusTab === "SHIPPED") return o.orderStatus === 23;
      if (statusTab === "DONE") return o.orderStatus === 24;
      if (statusTab === "CLOSED") return o.orderStatus >= 31;
      return true;
    });
  }, [list, statusTab, selectedShop, shops]);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sync",
          ...(selectedShop !== "ALL" ? { authorize_id: Number(selectedShop) } : {}),
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      toast.success(`已同步 ${json.data.synced} 条订单`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "同步失败");
    } finally {
      setSyncing(false);
    }
  }

  async function handleOpenDetail(order: OrderRow) {
    setActiveOrder(order);
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailData(null);
    setKamList([]);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "detail", order_no: order.orderNo }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setDetailData(json.data.detail);
      setKamList(json.data.kams ?? []);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "获取详情失败");
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleDummySend() {
    if (!activeOrder) return;
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "dummySend",
          order_no: activeOrder.orderNo,
          send_way: sendWay,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      toast.success("发货成功");
      setSendOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "发货失败");
    }
  }

  async function handleModifyPrice(e: React.FormEvent) {
    e.preventDefault();
    if (!activeOrder) return;
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "modifyPrice",
          order_no: activeOrder.orderNo,
          order_price: Math.round((Number(newPriceYuan) || 0) * 100),
          express_fee: 0,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      toast.success("已改价");
      setPriceOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "改价失败");
    }
  }

  const columns: ColumnDef<OrderRow>[] = [
    { accessorKey: "orderNo", header: "订单号" },
    {
      accessorKey: "productTitle",
      header: "商品",
      cell: ({ row }) => (
        <div className="max-w-xs truncate font-medium">{row.original.productTitle}</div>
      ),
    },
    { accessorKey: "buyerNick", header: "买家" },
    { accessorKey: "buyNum", header: "数量" },
    {
      accessorKey: "orderStatus",
      header: "状态",
      cell: ({ row }) => {
        const meta = ORDER_STATUS_MAP[row.original.orderStatus] ?? {
          label: String(row.original.orderStatus),
          variant: "outline" as const,
        };
        return <Badge variant={meta.variant}>{meta.label}</Badge>;
      },
    },
    {
      accessorKey: "payAmountFen",
      header: "实付",
      cell: ({ row }) => fenToYuan(row.original.payAmountFen),
    },
    {
      accessorKey: "costFen",
      header: "成本",
      cell: ({ row }) => fenToYuan(row.original.costFen),
    },
    {
      accessorKey: "profitFen",
      header: "毛利",
      cell: ({ row }) => (
        <span className={row.original.profitFen >= 0 ? "text-emerald-600 font-medium" : "text-destructive"}>
          {fenToYuan(row.original.profitFen)}
        </span>
      ),
    },
    {
      accessorKey: "createTime",
      header: "下单时间",
      cell: ({ row }) => unixToStr(row.original.createTime),
    },
    {
      id: "actions",
      header: "操作",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" onClick={() => handleOpenDetail(row.original)}>
            <Eye className="mr-1 h-3.5 w-3.5" />
            详情/卡密
          </Button>
          {row.original.orderStatus === 22 && (
            <Button
              size="sm"
              onClick={() => {
                setActiveOrder(row.original);
                setSendWay(2);
                setSendOpen(true);
              }}
            >
              <Send className="mr-1 h-3.5 w-3.5" />
              发卡
            </Button>
          )}
          {(row.original.orderStatus === 11 || row.original.orderStatus === 21) && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setActiveOrder(row.original);
                setNewPriceYuan((row.original.payAmountFen / 100).toFixed(2));
                setPriceOpen(true);
              }}
            >
              <DollarSign className="mr-1 h-3.5 w-3.5" />
              改价
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold tracking-tight">订单与发货</h2>
        <div className="flex items-center gap-2">
          <Select value={selectedShop} onValueChange={(v) => setSelectedShop(v ?? "ALL")}>
            <SelectTrigger className="w-44 h-9">
              <SelectValue placeholder="全部店铺" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">全部店铺</SelectItem>
              {shops.map((s) => (
                <SelectItem key={s.authorizeId} value={s.authorizeId}>
                  {s.shopName || s.userName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "同步中..." : "同步订单"}
          </Button>
        </div>
      </div>

      <Tabs value={statusTab} onValueChange={setStatusTab}>
        <TabsList>
          <TabsTrigger value="ALL">全部 ({list.length})</TabsTrigger>
          <TabsTrigger value="UNPAID">
            待付款 ({list.filter((o) => o.orderStatus === 11 || o.orderStatus === 21).length})
          </TabsTrigger>
          <TabsTrigger value="TO_SHIP">
            待发货 ({list.filter((o) => o.orderStatus === 22).length})
          </TabsTrigger>
          <TabsTrigger value="SHIPPED">
            已发货 ({list.filter((o) => o.orderStatus === 23).length})
          </TabsTrigger>
          <TabsTrigger value="DONE">
            交易成功 ({list.filter((o) => o.orderStatus === 24).length})
          </TabsTrigger>
          <TabsTrigger value="CLOSED">
            已关闭 ({list.filter((o) => o.orderStatus >= 31).length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <DataTable
        columns={columns}
        data={filteredList}
        searchKey="orderNo"
        searchPlaceholder="搜索订单号..."
      />

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>订单详情：{activeOrder?.orderNo}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-5 text-sm">
            {detailLoading ? (
              <div className="text-muted-foreground">加载中...</div>
            ) : (
              <>
                <div className="rounded-lg border p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">商品</span>
                    <span className="font-medium text-right max-w-xs">{activeOrder?.productTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">买家</span>
                    <span>{activeOrder?.buyerNick}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">实付 / 数量</span>
                    <span>{fenToYuan(activeOrder?.payAmountFen)} × {activeOrder?.buyNum}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">卖家备注</span>
                    <span>{String(detailData?.seller_remark || "-")}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="font-medium">发出卡密明细 ({kamList.length})</div>
                  {kamList.length === 0 ? (
                    <div className="rounded-lg border p-3 text-muted-foreground">暂无卡密记录</div>
                  ) : (
                    <div className="space-y-2">
                      {kamList.map((k, idx) => (
                        <div key={idx} className="rounded-lg border p-3 font-mono text-xs space-y-1">
                          <div className="flex justify-between">
                            <span>卡号：{k.card_no}</span>
                            <Badge variant="outline">{SOLD_TYPE_MAP[k.sold_type] ?? k.sold_type}</Badge>
                          </div>
                          <div>卡密：{k.card_pwd}</div>
                          <div className="text-muted-foreground">成本：{fenToYuan(k.cost)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>无需物流发货</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Button
              variant={sendWay === 2 ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => setSendWay(2)}
            >
              方式 2：发卡密并更新订单状态
            </Button>
            <Button
              variant={sendWay === 1 ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => setSendWay(1)}
            >
              方式 1：仅更新订单状态
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendOpen(false)}>
              取消
            </Button>
            <Button onClick={handleDummySend}>确认发货</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={priceOpen} onOpenChange={setPriceOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>修改订单价格</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleModifyPrice} className="space-y-4">
            <div className="space-y-1.5">
              <Label>订单总价（元）</Label>
              <Input
                type="number"
                step="0.01"
                value={newPriceYuan}
                onChange={(e) => setNewPriceYuan(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit">确认</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
