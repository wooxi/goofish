"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/image-uploader";
import { RegionSelector } from "@/components/region-selector";
import { toast } from "sonner";
import {
  RefreshCw,
  Pencil,
  ArrowDown,
  ArrowUp,
  Link2,
  Plus,
  Trash2,
} from "lucide-react";
import {
  fenToYuan,
  getProductDisplayStatus,
  ITEM_BIZ_TYPE_OPTIONS,
  SERVICE_SUPPORT_OPTIONS,
  SP_BIZ_TYPE_OPTIONS,
  STUFF_STATUS_OPTIONS,
} from "@/lib/format";

interface ProductRow {
  id: number;
  productId: string;
  title: string;
  outerId: string;
  productStatus: number;
  publishStatus: number;
  itemBizType: number;
  spBizType: number;
  channelCatId: string;
  priceFen: number;
  originalPriceFen: number;
  expressFeeFen: number;
  stock: number;
  sold: number;
  stuffStatus: number;
  errorMsg: string;
  specifyPublishTime: string;
  linkedKindId: string | null;
  localCostFen: number | null;
  publishShopJson: string;
  skuItemsJson: string;
  channelPvJson: string;
}

interface ShopOption {
  authorizeId: string;
  userName: string;
  shopName: string;
}

interface CategoryOption {
  channel_cat_id: string;
  channel_cat_name: string;
}

interface PvOption {
  property_id: string;
  property_name: string;
  values?: Array<{ value_id: string; value_name: string }>;
}

interface SkuDraft {
  sku_id?: number;
  sku_text: string;
  priceYuan: string;
  stock: string;
  outer_id: string;
}

export default function ProductsPage() {
  const [list, setList] = React.useState<ProductRow[]>([]);
  const [shops, setShops] = React.useState<ShopOption[]>([]);
  const [categories, setCategories] = React.useState<CategoryOption[]>([]);
  const [pvList, setPvList] = React.useState<PvOption[]>([]);
  const [syncing, setSyncing] = React.useState(false);
  const [statusTab, setStatusTab] = React.useState("ALL");

  // Stock & Cost dialogs
  const [stockOpen, setStockOpen] = React.useState(false);
  const [activeProd, setActiveProd] = React.useState<ProductRow | null>(null);
  const [newStock, setNewStock] = React.useState("0");

  const [costOpen, setCostOpen] = React.useState(false);
  const [linkedKindId, setLinkedKindId] = React.useState("");
  const [localCostYuan, setLocalCostYuan] = React.useState("0");

  const [deleteTarget, setDeleteTarget] = React.useState<ProductRow | null>(null);

  // Full Create / Edit Dialog
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editorMode, setEditorMode] = React.useState<"create" | "edit">("create");
  const [editingProductId, setEditingProductId] = React.useState<string>("");
  const [saving, setSaving] = React.useState(false);
  const [loadingDetail, setLoadingDetail] = React.useState(false);

  const [fUserName, setFUserName] = React.useState("");
  const [fItemBizType, setFItemBizType] = React.useState("2");
  const [fSpBizType, setFSpBizType] = React.useState("25");
  const [fCatId, setFCatId] = React.useState("");
  const [fSelectedPv, setFSelectedPv] = React.useState<
    Array<{ property_id: string; property_name: string; value_id: string; value_name: string }>
  >([]);
  const [fTitle, setFTitle] = React.useState("");
  const [fContent, setFContent] = React.useState("");
  const [fPriceYuan, setFPriceYuan] = React.useState("9.90");
  const [fOriginalPriceYuan, setFOriginalPriceYuan] = React.useState("9.90");
  const [fExpressFeeYuan, setFExpressFeeYuan] = React.useState("0");
  const [fStock, setFStock] = React.useState("99");
  const [fOuterId, setFOuterId] = React.useState("");
  const [fStuffStatus, setFStuffStatus] = React.useState("0");
  const [fServiceSupport, setFServiceSupport] = React.useState("NONE");
  const [fSpecifyTime, setFSpecifyTime] = React.useState("");
  const [fImages, setFImages] = React.useState<string[]>([]);
  const [fWhiteImages, setFWhiteImages] = React.useState<string[]>([]);
  const [fRegion, setFRegion] = React.useState({
    province: 110000,
    city: 110100,
    district: 110101,
  });
  const [fSkus, setFSkus] = React.useState<SkuDraft[]>([]);

  const load = React.useCallback(async () => {
    const [pRes, sRes] = await Promise.all([fetch("/api/products"), fetch("/api/shops")]);
    const pJson = await pRes.json();
    const sJson = await sRes.json();
    if (pJson.ok) setList(pJson.data.list);
    if (sJson.ok) {
      setShops(sJson.data.list);
      if (sJson.data.list.length > 0 && !fUserName) {
        setFUserName(sJson.data.list[0].userName);
      }
    }
  }, [fUserName]);

  React.useEffect(() => {
    load();
  }, [load]);

  const counts = React.useMemo(() => {
    let draft = 0;
    let onSale = 0;
    let offShelf = 0;
    let error = 0;
    for (const p of list) {
      const st = getProductDisplayStatus(p.productStatus, p.publishStatus, p.errorMsg);
      if (st.bucket === "DRAFT") draft++;
      else if (st.bucket === "ON_SALE") onSale++;
      else if (st.bucket === "OFF_SHELF") offShelf++;
      else if (st.bucket === "ERROR") error++;
    }
    return { all: list.length, draft, onSale, offShelf, error };
  }, [list]);

  const filteredList = React.useMemo(() => {
    if (statusTab === "ALL") return list;
    return list.filter(
      (p) => getProductDisplayStatus(p.productStatus, p.publishStatus, p.errorMsg).bucket === statusTab
    );
  }, [list, statusTab]);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      toast.success(`已同步 ${json.data.synced} 条商品`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "同步失败");
    } finally {
      setSyncing(false);
    }
  }

  function openCreateEditor() {
    setEditorMode("create");
    setEditingProductId("");
    setFTitle("");
    setFContent("");
    setFPriceYuan("9.90");
    setFOriginalPriceYuan("9.90");
    setFExpressFeeYuan("0");
    setFStock("99");
    setFOuterId("");
    setFStuffStatus("0");
    setFServiceSupport("NONE");
    setFSpecifyTime("");
    setFImages([]);
    setFWhiteImages([]);
    setFSelectedPv([]);
    setFSkus([]);
    setPvList([]);
    setEditorOpen(true);
  }

  async function openEditEditor(prod: ProductRow) {
    setEditorMode("edit");
    setEditingProductId(prod.productId);
    setEditorOpen(true);
    setLoadingDetail(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "detail", product_id: Number(prod.productId) }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      const d = json.data;
      setFItemBizType(String(d.item_biz_type ?? 2));
      setFSpBizType(String(d.sp_biz_type ?? 25));
      setFCatId(String(d.channel_cat_id ?? ""));
      setFSelectedPv(Array.isArray(d.channel_pv) ? d.channel_pv : []);
      setFTitle(String(d.title ?? ""));
      setFPriceYuan(((Number(d.price) || 0) / 100).toFixed(2));
      setFOriginalPriceYuan(((Number(d.original_price ?? d.price) || 0) / 100).toFixed(2));
      setFExpressFeeYuan(((Number(d.express_fee) || 0) / 100).toFixed(2));
      setFStock(String(d.stock ?? 1));
      setFOuterId(String(d.outer_id ?? ""));
      setFStuffStatus(String(d.stuff_status ?? 0));
      setFSpecifyTime(
        d.specify_publish_time && Number(d.specify_publish_time) !== 0
          ? String(d.specify_publish_time)
          : ""
      );

      const ps = Array.isArray(d.publish_shop) && d.publish_shop.length > 0 ? d.publish_shop[0] : null;
      if (ps) {
        if (ps.user_name) setFUserName(String(ps.user_name));
        setFTitle(String(ps.title ?? d.title ?? ""));
        setFContent(String(ps.content ?? ""));
        setFImages(Array.isArray(ps.images) ? ps.images : []);
        setFWhiteImages(ps.white_images ? [String(ps.white_images)] : []);
        setFServiceSupport(ps.service_support ? String(ps.service_support) : "NONE");
        setFRegion({
          province: Number(ps.province || 110000),
          city: Number(ps.city || 110100),
          district: Number(ps.district || 110101),
        });
      }

      if (Array.isArray(d.sku_items)) {
        setFSkus(
          d.sku_items.map((s: { sku_id?: number; sku_text?: string; price?: number; stock?: number; outer_id?: string }) => ({
            sku_id: s.sku_id,
            sku_text: s.sku_text || "",
            priceYuan: ((Number(s.price) || 0) / 100).toFixed(2),
            stock: String(s.stock ?? 0),
            outer_id: s.outer_id || "",
          }))
        );
      } else {
        setFSkus([]);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "加载商品详情失败");
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleLoadCategories() {
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "categories",
          item_biz_type: Number(fItemBizType),
          sp_biz_type: Number(fSpBizType),
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      const cats = (json.data.list ?? []) as CategoryOption[];
      setCategories(cats);
      if (cats.length > 0 && !fCatId) setFCatId(cats[0].channel_cat_id);
      toast.success(`已拉取 ${cats.length} 个类目`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "拉取类目失败");
    }
  }

  async function handleLoadPvs() {
    if (!fCatId) return;
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "pvs",
          item_biz_type: Number(fItemBizType),
          sp_biz_type: Number(fSpBizType),
          channel_cat_id: fCatId,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setPvList((json.data.list ?? []) as PvOption[]);
      toast.success(`已拉取 ${(json.data.list ?? []).length} 项属性`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "拉取属性失败");
    }
  }

  async function handleSubmitEditor(e: React.FormEvent) {
    e.preventDefault();
    if (!fUserName || !fCatId) {
      toast.error("请选择店铺与商品类目");
      return;
    }
    if (fImages.length === 0) {
      toast.error("请至少上传 1 张商品图片");
      return;
    }

    const skuPayload = fSkus
      .filter((s) => s.sku_text.trim())
      .map((s) => ({
        ...(s.sku_id ? { sku_id: s.sku_id } : {}),
        sku_text: s.sku_text.trim(),
        price: Math.round((Number(s.priceYuan) || 0) * 100),
        stock: Number(s.stock) || 0,
        outer_id: s.outer_id.trim(),
      }));

    const payload = {
      action: editorMode,
      ...(editorMode === "edit" ? { product_id: Number(editingProductId) } : {}),
      item_biz_type: Number(fItemBizType),
      sp_biz_type: Number(fSpBizType),
      channel_cat_id: fCatId,
      ...(fSelectedPv.length > 0 ? { channel_pv: fSelectedPv } : {}),
      price: Math.round((Number(fPriceYuan) || 0) * 100),
      original_price: Math.round((Number(fOriginalPriceYuan) || Number(fPriceYuan) || 0) * 100),
      express_fee: Math.round((Number(fExpressFeeYuan) || 0) * 100),
      stock: Number(fStock) || 1,
      outer_id: fOuterId.trim(),
      stuff_status: Number(fStuffStatus),
      ...(fSpecifyTime.trim() ? { specify_publish_time: fSpecifyTime.trim() } : {}),
      publish_shop: [
        {
          user_name: fUserName,
          province: fRegion.province,
          city: fRegion.city,
          district: fRegion.district,
          title: fTitle,
          content: fContent,
          images: fImages,
          ...(fWhiteImages[0] ? { white_images: fWhiteImages[0] } : {}),
          ...(fServiceSupport && fServiceSupport !== "NONE"
            ? { service_support: fServiceSupport }
            : {}),
          status: 1,
        },
      ],
      ...(skuPayload.length > 0 ? { sku_items: skuPayload } : {}),
      notify_url: `${window.location.origin}/api/webhooks/goofish/product`,
    };

    setSaving(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      toast.success(editorMode === "create" ? `已创建：${json.data.product_id}` : "已提交更新");
      setEditorOpen(false);
      await handleSync();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish(prod: ProductRow) {
    try {
      let userNames: string[] = [];
      try {
        const parsed = JSON.parse(prod.publishShopJson || "[]") as Array<{ user_name?: string }>;
        userNames = parsed.map((p) => p.user_name || "").filter(Boolean);
      } catch {
        // ignore
      }
      if (userNames.length === 0 && shops.length > 0) {
        userNames = [shops[0].userName];
      }
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "publish",
          product_id: Number(prod.productId),
          user_name: userNames,
          notify_url: `${window.location.origin}/api/webhooks/goofish/product`,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      toast.success("已发起上架");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "上架失败");
    }
  }

  async function handleDownShelf(productId: string) {
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "downShelf", product_id: Number(productId) }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      toast.success("已下架");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "下架失败");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", product_id: Number(deleteTarget.productId) }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      toast.success("已删除");
      setDeleteTarget(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "删除失败");
    }
  }

  async function handleEditStock(e: React.FormEvent) {
    e.preventDefault();
    if (!activeProd) return;
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "editStock",
          product_id: Number(activeProd.productId),
          stock: Number(newStock),
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      toast.success("库存已更新");
      setStockOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "更新失败");
    }
  }

  async function handleSaveLink(e: React.FormEvent) {
    e.preventDefault();
    if (!activeProd) return;
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "linkKami",
          product_id: activeProd.productId,
          linked_kind_id: linkedKindId.trim() || null,
          local_cost_fen: localCostYuan ? Math.round(Number(localCostYuan) * 100) : null,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      toast.success("已绑定");
      setCostOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存失败");
    }
  }

  const columns: ColumnDef<ProductRow>[] = [
    { accessorKey: "productId", header: "管家 ID" },
    {
      accessorKey: "title",
      header: "商品标题",
      cell: ({ row }) => (
        <div className="max-w-xs space-y-0.5">
          <div className="truncate font-medium">{row.original.title}</div>
          {row.original.errorMsg && (
            <div className="truncate text-xs text-destructive">{row.original.errorMsg}</div>
          )}
        </div>
      ),
    },
    {
      id: "status",
      header: "状态",
      cell: ({ row }) => {
        const meta = getProductDisplayStatus(
          row.original.productStatus,
          row.original.publishStatus,
          row.original.errorMsg
        );
        return <Badge variant={meta.variant}>{meta.label}</Badge>;
      },
    },
    {
      accessorKey: "priceFen",
      header: "售价",
      cell: ({ row }) => fenToYuan(row.original.priceFen),
    },
    {
      accessorKey: "localCostFen",
      header: "本地成本",
      cell: ({ row }) =>
        row.original.localCostFen !== null ? fenToYuan(row.original.localCostFen) : "-",
    },
    { accessorKey: "stock", header: "库存" },
    { accessorKey: "sold", header: "销量" },
    {
      id: "actions",
      header: "操作",
      cell: ({ row }) => {
        const st = getProductDisplayStatus(
          row.original.productStatus,
          row.original.publishStatus,
          row.original.errorMsg
        );
        return (
          <div className="flex flex-wrap items-center gap-1">
            <Button size="sm" variant="outline" onClick={() => openEditEditor(row.original)}>
              <Pencil className="mr-1 h-3.5 w-3.5" />
              编辑详情
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setActiveProd(row.original);
                setNewStock(String(row.original.stock));
                setStockOpen(true);
              }}
            >
              改库存
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setActiveProd(row.original);
                setLinkedKindId(row.original.linkedKindId || "");
                setLocalCostYuan(
                  row.original.localCostFen !== null
                    ? (row.original.localCostFen / 100).toFixed(2)
                    : "0"
                );
                setCostOpen(true);
              }}
            >
              <Link2 className="mr-1 h-3.5 w-3.5" />
              成本
            </Button>
            {st.bucket === "ON_SALE" ? (
              <Button
                size="sm"
                variant="ghost"
                title="下架"
                onClick={() => handleDownShelf(row.original.productId)}
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                title="上架"
                onClick={() => handlePublish(row.original)}
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
            )}
            {st.bucket !== "ON_SALE" && (
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => setDeleteTarget(row.original)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold tracking-tight">商品管理</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={openCreateEditor}>
            <Plus className="mr-1.5 h-4 w-4" />
            创建商品
          </Button>
          <Button onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "同步中..." : "全量同步商品"}
          </Button>
        </div>
      </div>

      <Tabs value={statusTab} onValueChange={setStatusTab}>
        <TabsList>
          <TabsTrigger value="ALL">全部 ({counts.all})</TabsTrigger>
          <TabsTrigger value="DRAFT">待发布/草稿 ({counts.draft})</TabsTrigger>
          <TabsTrigger value="ON_SALE">销售中 ({counts.onSale})</TabsTrigger>
          <TabsTrigger value="OFF_SHELF">已下架/售罄 ({counts.offShelf})</TabsTrigger>
          <TabsTrigger value="ERROR">异常 ({counts.error})</TabsTrigger>
        </TabsList>
      </Tabs>

      <DataTable
        columns={columns}
        data={filteredList}
        searchKey="title"
        searchPlaceholder="搜索商品标题..."
      />

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="sm:max-w-5xl w-[95vw] max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <span>{editorMode === "create" ? "创建商品" : "编辑商品"}</span>
              {editorMode === "edit" && (
                <Badge variant="outline" className="font-mono text-xs">
                  {editingProductId}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {loadingDetail ? (
            <div className="p-10 text-center text-sm text-muted-foreground">加载中...</div>
          ) : (
            <form onSubmit={handleSubmitEditor} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* 左列：基础详情、图片、多规格 */}
                  <div className="lg:col-span-7 space-y-5">
                    <div className="rounded-xl border bg-card p-4 space-y-4">
                      <div className="text-sm font-medium">基础信息</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>发布店铺</Label>
                          <Select value={fUserName} onValueChange={(v) => setFUserName(v ?? "")}>
                            <SelectTrigger>
                              <SelectValue placeholder="选择店铺" />
                            </SelectTrigger>
                            <SelectContent>
                              {shops.map((s) => (
                                <SelectItem key={s.authorizeId} value={s.userName}>
                                  {s.shopName || s.userName} ({s.userName})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>商家编码</Label>
                          <Input value={fOuterId} onChange={(e) => setFOuterId(e.target.value)} />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label>商品标题</Label>
                        <Input
                          value={fTitle}
                          onChange={(e) => setFTitle(e.target.value)}
                          maxLength={60}
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label>商品描述</Label>
                        <Textarea
                          rows={7}
                          value={fContent}
                          onChange={(e) => setFContent(e.target.value)}
                          minLength={5}
                          required
                        />
                      </div>
                    </div>

                    <div className="rounded-xl border bg-card p-4 space-y-4">
                      <div className="text-sm font-medium">商品图片</div>
                      <ImageUploader value={fImages} onChange={setFImages} multiple />
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">白底图</Label>
                        <ImageUploader value={fWhiteImages} onChange={setFWhiteImages} multiple={false} />
                      </div>
                    </div>

                    <div className="rounded-xl border bg-card p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">多规格 SKU ({fSkus.length})</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setFSkus((prev) => [
                              ...prev,
                              { sku_text: "", priceYuan: fPriceYuan, stock: "10", outer_id: "" },
                            ])
                          }
                        >
                          <Plus className="mr-1 h-3.5 w-3.5" />
                          添加规格
                        </Button>
                      </div>

                      {fSkus.length > 0 && (
                        <div className="space-y-2">
                          <div className="grid grid-cols-12 gap-2 px-1 text-xs text-muted-foreground">
                            <div className="col-span-5">规格名称</div>
                            <div className="col-span-2">售价(元)</div>
                            <div className="col-span-2">库存</div>
                            <div className="col-span-2">编码</div>
                            <div className="col-span-1" />
                          </div>
                          {fSkus.map((sku, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                              <Input
                                className="col-span-5 h-8 text-xs"
                                placeholder="规格:值"
                                value={sku.sku_text}
                                onChange={(e) =>
                                  setFSkus((prev) =>
                                    prev.map((item, i) =>
                                      i === idx ? { ...item, sku_text: e.target.value } : item
                                    )
                                  )
                                }
                              />
                              <Input
                                className="col-span-2 h-8 text-xs"
                                type="number"
                                step="0.01"
                                value={sku.priceYuan}
                                onChange={(e) =>
                                  setFSkus((prev) =>
                                    prev.map((item, i) =>
                                      i === idx ? { ...item, priceYuan: e.target.value } : item
                                    )
                                  )
                                }
                              />
                              <Input
                                className="col-span-2 h-8 text-xs"
                                type="number"
                                value={sku.stock}
                                onChange={(e) =>
                                  setFSkus((prev) =>
                                    prev.map((item, i) =>
                                      i === idx ? { ...item, stock: e.target.value } : item
                                    )
                                  )
                                }
                              />
                              <Input
                                className="col-span-2 h-8 text-xs"
                                value={sku.outer_id}
                                onChange={(e) =>
                                  setFSkus((prev) =>
                                    prev.map((item, i) =>
                                      i === idx ? { ...item, outer_id: e.target.value } : item
                                    )
                                  )
                                }
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="col-span-1 h-8 px-1 text-destructive"
                                onClick={() => setFSkus((prev) => prev.filter((_, i) => i !== idx))}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 右列：类目属性、价格库存、发货地 */}
                  <div className="lg:col-span-5 space-y-5">
                    <div className="rounded-xl border bg-card p-4 space-y-4">
                      <div className="text-sm font-medium">类目与属性</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>商品类型</Label>
                          <Select value={fItemBizType} onValueChange={(v) => setFItemBizType(v ?? "2")}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ITEM_BIZ_TYPE_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>行业类型</Label>
                          <Select value={fSpBizType} onValueChange={(v) => setFSpBizType(v ?? "25")}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SP_BIZ_TYPE_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label>商品类目</Label>
                          <div className="flex gap-1.5">
                            <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={handleLoadCategories}>
                              拉取类目
                            </Button>
                            <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={handleLoadPvs}>
                              拉取属性
                            </Button>
                          </div>
                        </div>
                        {categories.length > 0 ? (
                          <Select value={fCatId} onValueChange={(v) => setFCatId(v ?? "")}>
                            <SelectTrigger>
                              <SelectValue placeholder="选择类目" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((c) => (
                                <SelectItem key={c.channel_cat_id} value={c.channel_cat_id}>
                                  {c.channel_cat_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input value={fCatId} onChange={(e) => setFCatId(e.target.value)} required />
                        )}
                      </div>

                      {pvList.length > 0 && (
                        <div className="grid grid-cols-2 gap-2.5 border-t pt-3">
                          {pvList.slice(0, 8).map((pv) => {
                            const current = fSelectedPv.find((x) => x.property_id === pv.property_id);
                            return (
                              <div key={pv.property_id} className="space-y-1">
                                <Label className="text-xs">{pv.property_name}</Label>
                                <Select
                                  value={current?.value_id || ""}
                                  onValueChange={(valId) => {
                                    const foundVal = pv.values?.find((v) => v.value_id === valId);
                                    if (!foundVal) return;
                                    setFSelectedPv((prev) => [
                                      ...prev.filter((x) => x.property_id !== pv.property_id),
                                      {
                                        property_id: pv.property_id,
                                        property_name: pv.property_name,
                                        value_id: foundVal.value_id,
                                        value_name: foundVal.value_name,
                                      },
                                    ]);
                                  }}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="选择" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(pv.values ?? []).map((v) => (
                                      <SelectItem key={v.value_id} value={v.value_id}>
                                        {v.value_name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl border bg-card p-4 space-y-4">
                      <div className="text-sm font-medium">定价与设置</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>售价（元）</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={fPriceYuan}
                            onChange={(e) => setFPriceYuan(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>原价（元）</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={fOriginalPriceYuan}
                            onChange={(e) => setFOriginalPriceYuan(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>运费（元）</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={fExpressFeeYuan}
                            onChange={(e) => setFExpressFeeYuan(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>总库存</Label>
                          <Input
                            type="number"
                            min={1}
                            value={fStock}
                            onChange={(e) => setFStock(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>成色</Label>
                          <Select value={fStuffStatus} onValueChange={(v) => setFStuffStatus(v ?? "0")}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STUFF_STATUS_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label>服务项</Label>
                          <Select value={fServiceSupport} onValueChange={(v) => setFServiceSupport(v ?? "NONE")}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SERVICE_SUPPORT_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label>定时上架</Label>
                        <Input
                          value={fSpecifyTime}
                          onChange={(e) => setFSpecifyTime(e.target.value)}
                          placeholder="YYYY-MM-DD HH:mm:ss"
                        />
                      </div>
                    </div>

                    <div className="rounded-xl border bg-card p-4 space-y-3">
                      <div className="text-sm font-medium">发货地区</div>
                      <RegionSelector
                        province={fRegion.province}
                        city={fRegion.city}
                        district={fRegion.district}
                        onChange={setFRegion}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="px-6 py-3.5 border-t bg-muted/30 shrink-0">
                <Button type="button" variant="outline" onClick={() => setEditorOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "提交中..." : "保存"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={stockOpen} onOpenChange={setStockOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>修改库存：{activeProd?.title}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditStock} className="space-y-4">
            <div className="space-y-1.5">
              <Label>新库存</Label>
              <Input
                type="number"
                min={0}
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit">保存</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={costOpen} onOpenChange={setCostOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>绑定成本与卡种</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveLink} className="space-y-4">
            <div className="space-y-1.5">
              <Label>卡种 ID</Label>
              <Input value={linkedKindId} onChange={(e) => setLinkedKindId(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>单件固定成本（元）</Label>
              <Input
                type="number"
                step="0.01"
                value={localCostYuan}
                onChange={(e) => setLocalCostYuan(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="submit">保存</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除商品？</AlertDialogTitle>
            <AlertDialogDescription>{deleteTarget?.title}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>确认删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
