"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, RefreshCw, Upload, Trash2, Pencil, Download, Ban } from "lucide-react";
import { fenToYuan } from "@/lib/format";

interface KamiCategory {
  id: number;
  categoryId: string;
  categoryName: string;
  remark: string;
  updateTime: string;
}

interface KamiKind {
  id: number;
  kindId: string;
  kindName: string;
  kindCategory: string;
  kindType: number;
  cardType: number;
  pwdType: number;
  cost: string;
  avgCost: string;
  stock: number;
  sold: number;
  totalCost: string;
  stockWarning: number;
}

interface KamiGroup {
  id: number;
  groupId: string;
  groupName: string;
  groupType: number;
  status: number;
  modifyTime: string;
}

interface LocalCardRow {
  id: number;
  kindId: string;
  cardNo: string;
  cardPwd: string;
  unitCostFen: number;
  status: string;
  orderNo: string | null;
  batch?: { batchNo: string; kindName: string };
}

interface Supplier {
  id: number;
  name: string;
}

export default function KamiPage() {
  const [categories, setCategories] = React.useState<KamiCategory[]>([]);
  const [kinds, setKinds] = React.useState<KamiKind[]>([]);
  const [groups, setGroups] = React.useState<KamiGroup[]>([]);
  const [cards, setCards] = React.useState<LocalCardRow[]>([]);
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [syncing, setSyncing] = React.useState(false);

  // Batch import dialog
  const [importOpen, setImportOpen] = React.useState(false);
  const [selectedKind, setSelectedKind] = React.useState<KamiKind | null>(null);
  const [supplierId, setSupplierId] = React.useState<string>("NONE");
  const [unitCostYuan, setUnitCostYuan] = React.useState("0");
  const [rawCards, setRawCards] = React.useState("");
  const [pushToGoofish, setPushToGoofish] = React.useState(true);
  const [isCover, setIsCover] = React.useState(false);
  const [isRepeat, setIsRepeat] = React.useState(false);
  const [isPriority, setIsPriority] = React.useState(true);
  const [importing, setImporting] = React.useState(false);

  // Create/Edit kind dialog
  const [kindOpen, setKindOpen] = React.useState(false);
  const [editingKindId, setEditingKindId] = React.useState<string | null>(null);
  const [kindName, setKindName] = React.useState("");
  const [kindCost, setKindCost] = React.useState("0");
  const [kindWarning, setKindWarning] = React.useState("5");

  // Create/Edit category dialog
  const [catOpen, setCatOpen] = React.useState(false);
  const [editingCatId, setEditingCatId] = React.useState<string | null>(null);
  const [catName, setCatName] = React.useState("");
  const [catRemark, setCatRemark] = React.useState("");

  const load = React.useCallback(async () => {
    const [kRes, pRes, cRes] = await Promise.all([
      fetch("/api/kami"),
      fetch("/api/purchases"),
      fetch("/api/cards"),
    ]);
    const kJson = await kRes.json();
    const pJson = await pRes.json();
    const cJson = await cRes.json();
    if (kJson.ok) {
      setCategories(kJson.data.categories);
      setKinds(kJson.data.kinds);
      setGroups(kJson.data.groups);
    }
    if (pJson.ok) setSuppliers(pJson.data.suppliers);
    if (cJson.ok) setCards(cJson.data.list);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/kami", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      toast.success(
        `同步完成：分类 ${json.data.categories}，卡种 ${json.data.kinds}，组合 ${json.data.groups}`
      );
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "同步失败");
    } finally {
      setSyncing(false);
    }
  }

  function parseCardsText(input: string) {
    return input
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(/----|\t|,|\s+/);
        const card_no = parts[0]?.trim() || "";
        const card_pwd = parts.slice(1).join(" ").trim() || card_no;
        return { card_no, card_pwd };
      })
      .filter((c) => c.card_no.length > 0);
  }

  async function handleTxtFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    setRawCards((prev) => (prev.trim() ? `${prev.trim()}\n${content}` : content));
    e.target.value = "";
  }

  async function handleImportSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedKind) return;
    const parsedCards = parseCardsText(rawCards);
    if (parsedCards.length === 0) {
      toast.error("请输入卡密");
      return;
    }
    setImporting(true);
    try {
      const unitCostFen = Math.round((Number(unitCostYuan) || 0) * 100);
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createBatch",
          supplierId: supplierId !== "NONE" ? Number(supplierId) : null,
          kindId: selectedKind.kindId,
          kindName: selectedKind.kindName,
          unitCostFen,
          pushToGoofish,
          isCover,
          isRepeat,
          isPriority,
          cards: parsedCards,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      toast.success(`入库成功：${json.data.batchNo}（${parsedCards.length} 条）`);
      setImportOpen(false);
      setRawCards("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "入库失败");
    } finally {
      setImporting(false);
    }
  }

  async function handleSaveKind(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/kami", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: editingKindId ? "editKind" : "createKind",
          ...(editingKindId ? { kind_id: Number(editingKindId) } : {}),
          kind_name: kindName,
          kind_type: 1,
          card_type: 1,
          pwd_type: 1,
          cost_fen: Math.round((Number(kindCost) || 0) * 100),
          stock_warning: Number(kindWarning) || 5,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      toast.success(editingKindId ? "卡种已更新" : "卡种已创建");
      setKindOpen(false);
      setEditingKindId(null);
      setKindName("");
      await handleSync();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "操作失败");
    }
  }

  async function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/kami", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: editingCatId ? "editCategory" : "createCategory",
          ...(editingCatId ? { category_id: Number(editingCatId) } : {}),
          category_name: catName,
          remark: catRemark,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      toast.success(editingCatId ? "分类已更新" : "分类已创建");
      setCatOpen(false);
      setEditingCatId(null);
      setCatName("");
      setCatRemark("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "操作失败");
    }
  }

  async function handleDeleteCategory(categoryId: string) {
    try {
      const res = await fetch("/api/kami", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteCategory", category_ids: [Number(categoryId)] }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      toast.success("已删除");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除失败");
    }
  }

  async function handleToggleGroup(g: KamiGroup) {
    const nextStatus = g.status === 1 ? 2 : 1;
    try {
      const res = await fetch("/api/kami", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateGroupStatus",
          group_ids: [Number(g.groupId)],
          status: nextStatus,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      toast.success(nextStatus === 1 ? "已启用" : "已禁用");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "操作失败");
    }
  }

  async function handleDeleteGroup(groupId: string) {
    try {
      const res = await fetch("/api/kami", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteGroup", group_ids: [Number(groupId)] }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      toast.success("已删除");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除失败");
    }
  }

  async function handleVoidCard(id: number) {
    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateStatus", ids: [id], status: "VOID" }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      toast.success("已标记作废");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "操作失败");
    }
  }

  function handleExportCards() {
    const txt = cards.map((c) => `${c.cardNo}----${c.cardPwd}`).join("\n");
    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cards-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const kindColumns: ColumnDef<KamiKind>[] = [
    { accessorKey: "kindName", header: "卡种名称" },
    {
      accessorKey: "kindType",
      header: "类型",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.kindType === 1 ? "唯一卡" : "图片"}</Badge>
      ),
    },
    {
      accessorKey: "stock",
      header: "未售库存",
      cell: ({ row }) => (
        <Badge variant={row.original.stock <= row.original.stockWarning ? "destructive" : "default"}>
          {row.original.stock}
        </Badge>
      ),
    },
    { accessorKey: "sold", header: "已售" },
    {
      accessorKey: "avgCost",
      header: "均价成本",
      cell: ({ row }) => `¥${row.original.avgCost || row.original.cost}`,
    },
    {
      accessorKey: "totalCost",
      header: "未售总成本",
      cell: ({ row }) => `¥${row.original.totalCost}`,
    },
    {
      id: "actions",
      header: "操作",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedKind(row.original);
              setUnitCostYuan(row.original.cost || "0");
              setImportOpen(true);
            }}
          >
            <Upload className="mr-1 h-3.5 w-3.5" />
            入库
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setEditingKindId(row.original.kindId);
              setKindName(row.original.kindName);
              setKindCost(row.original.cost || "0");
              setKindWarning(String(row.original.stockWarning ?? 5));
              setKindOpen(true);
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const catColumns: ColumnDef<KamiCategory>[] = [
    { accessorKey: "categoryId", header: "分类 ID" },
    { accessorKey: "categoryName", header: "分类名称" },
    { accessorKey: "remark", header: "备注" },
    { accessorKey: "updateTime", header: "更新时间" },
    {
      id: "actions",
      header: "操作",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setEditingCatId(row.original.categoryId);
              setCatName(row.original.categoryName);
              setCatRemark(row.original.remark);
              setCatOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={() => handleDeleteCategory(row.original.categoryId)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const groupColumns: ColumnDef<KamiGroup>[] = [
    { accessorKey: "groupId", header: "组合 ID" },
    { accessorKey: "groupName", header: "组合名称" },
    {
      accessorKey: "groupType",
      header: "类型",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.groupType === 1 ? "普通组合" : "数量组合"}</Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "状态",
      cell: ({ row }) => (
        <Badge variant={row.original.status === 1 ? "default" : "secondary"}>
          {row.original.status === 1 ? "启用" : "禁用"}
        </Badge>
      ),
    },
    { accessorKey: "modifyTime", header: "更新时间" },
    {
      id: "actions",
      header: "操作",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" onClick={() => handleToggleGroup(row.original)}>
            {row.original.status === 1 ? "禁用" : "启用"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={() => handleDeleteGroup(row.original.groupId)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const cardColumns: ColumnDef<LocalCardRow>[] = [
    { accessorKey: "cardNo", header: "卡号" },
    { accessorKey: "cardPwd", header: "卡密" },
    {
      id: "kindName",
      header: "卡种",
      cell: ({ row }) => row.original.batch?.kindName || row.original.kindId,
    },
    {
      accessorKey: "unitCostFen",
      header: "成本",
      cell: ({ row }) => fenToYuan(row.original.unitCostFen),
    },
    {
      accessorKey: "status",
      header: "状态",
      cell: ({ row }) => (
        <Badge variant={row.original.status === "VOID" ? "destructive" : "outline"}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "操作",
      cell: ({ row }) =>
        row.original.status !== "VOID" ? (
          <Button size="sm" variant="ghost" onClick={() => handleVoidCard(row.original.id)}>
            <Ban className="mr-1 h-3.5 w-3.5" />
            作废
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold tracking-tight">卡密库与采购入库</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setEditingCatId(null);
              setCatName("");
              setCatRemark("");
              setCatOpen(true);
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            新建分类
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setEditingKindId(null);
              setKindName("");
              setKindCost("0");
              setKindWarning("5");
              setKindOpen(true);
            }}
          >
            <Plus className="mr-1 h-4 w-4" />
            新建卡种
          </Button>
          <Button onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`mr-1.5 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "同步中..." : "同步卡密库"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="kinds">
        <TabsList>
          <TabsTrigger value="kinds">卡种库存 ({kinds.length})</TabsTrigger>
          <TabsTrigger value="cards">本地卡密明细 ({cards.length})</TabsTrigger>
          <TabsTrigger value="categories">卡密分类 ({categories.length})</TabsTrigger>
          <TabsTrigger value="groups">发卡组合 ({groups.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="kinds" className="pt-3">
          <DataTable
            columns={kindColumns}
            data={kinds}
            searchKey="kindName"
            searchPlaceholder="搜索卡种..."
          />
        </TabsContent>

        <TabsContent value="cards" className="pt-3">
          <DataTable
            columns={cardColumns}
            data={cards}
            searchKey="cardNo"
            searchPlaceholder="搜索卡号..."
            toolbarExtra={
              <Button size="sm" variant="outline" onClick={handleExportCards}>
                <Download className="mr-1.5 h-3.5 w-3.5" />
                导出 TXT
              </Button>
            }
          />
        </TabsContent>

        <TabsContent value="categories" className="pt-3">
          <DataTable
            columns={catColumns}
            data={categories}
            searchKey="categoryName"
            searchPlaceholder="搜索分类..."
          />
        </TabsContent>

        <TabsContent value="groups" className="pt-3">
          <DataTable
            columns={groupColumns}
            data={groups}
            searchKey="groupName"
            searchPlaceholder="搜索组合..."
          />
        </TabsContent>
      </Tabs>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>采购入库：{selectedKind?.kindName}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleImportSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>供应商</Label>
                <Select value={supplierId} onValueChange={(v) => setSupplierId(v ?? "NONE")}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择供应商" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">未指定</SelectItem>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>采购单价（元/条）</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={unitCostYuan}
                  onChange={(e) => setUnitCostYuan(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>卡密明细（{parseCardsText(rawCards).length} 条）</Label>
                <Input type="file" accept=".txt,.csv" onChange={handleTxtFile} className="h-7 w-44 text-xs" />
              </div>
              <Textarea
                rows={6}
                placeholder={"CARD001----PWD001"}
                value={rawCards}
                onChange={(e) => setRawCards(e.target.value)}
                className="font-mono text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center justify-between rounded-lg border p-2.5">
                <span>推送闲管家</span>
                <Switch checked={pushToGoofish} onCheckedChange={setPushToGoofish} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-2.5">
                <span>优先出售</span>
                <Switch checked={isPriority} onCheckedChange={setIsPriority} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-2.5">
                <span>覆盖重复</span>
                <Switch checked={isCover} onCheckedChange={setIsCover} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-2.5">
                <span>允许重复</span>
                <Switch checked={isRepeat} onCheckedChange={setIsRepeat} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setImportOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={importing}>
                {importing ? "入库中..." : "确认入库"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={kindOpen} onOpenChange={setKindOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingKindId ? "编辑卡种" : "新建卡种"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveKind} className="space-y-4">
            <div className="space-y-1.5">
              <Label>卡种名称</Label>
              <Input value={kindName} onChange={(e) => setKindName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>成本单价（元）</Label>
                <Input type="number" step="0.01" value={kindCost} onChange={(e) => setKindCost(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>库存预警阈值</Label>
                <Input type="number" value={kindWarning} onChange={(e) => setKindWarning(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">保存</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCatId ? "编辑卡密分类" : "新建卡密分类"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCategory} className="space-y-4">
            <div className="space-y-1.5">
              <Label>分类名称</Label>
              <Input value={catName} onChange={(e) => setCatName(e.target.value)} maxLength={20} required />
            </div>
            <div className="space-y-1.5">
              <Label>备注</Label>
              <Input value={catRemark} onChange={(e) => setCatRemark(e.target.value)} maxLength={50} required />
            </div>
            <DialogFooter>
              <Button type="submit">保存</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
