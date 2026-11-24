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
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { fenToYuan } from "@/lib/format";

interface Supplier {
  id: number;
  name: string;
  contact: string;
  channel: string;
  remark: string;
}

interface PurchaseBatch {
  id: number;
  batchNo: string;
  kindId: string;
  kindName: string;
  quantity: number;
  unitCostFen: number;
  totalCostFen: number;
  pushedToGoofish: boolean;
  goofishSyncMsg: string;
  purchasedAt: string;
  supplier?: Supplier | null;
}

export default function PurchasesPage() {
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
  const [batches, setBatches] = React.useState<PurchaseBatch[]>([]);
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [contact, setContact] = React.useState("");
  const [channel, setChannel] = React.useState("");
  const [remark, setRemark] = React.useState("");

  const load = React.useCallback(async () => {
    const res = await fetch("/api/purchases");
    const json = await res.json();
    if (json.ok) {
      setSuppliers(json.data.suppliers);
      setBatches(json.data.batches);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleCreateSupplier(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createSupplier", name, contact, channel, remark }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      toast.success("供应商已添加");
      setOpen(false);
      setName("");
      setContact("");
      setChannel("");
      setRemark("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "添加失败");
    }
  }

  const batchCols: ColumnDef<PurchaseBatch>[] = [
    { accessorKey: "batchNo", header: "采购单号" },
    { accessorKey: "kindName", header: "卡种名称" },
    {
      id: "supplier",
      header: "供应商",
      cell: ({ row }) => row.original.supplier?.name || "未指定",
    },
    { accessorKey: "quantity", header: "入库数量" },
    {
      accessorKey: "unitCostFen",
      header: "采购单价",
      cell: ({ row }) => fenToYuan(row.original.unitCostFen),
    },
    {
      accessorKey: "totalCostFen",
      header: "批次总额",
      cell: ({ row }) => fenToYuan(row.original.totalCostFen),
    },
    {
      accessorKey: "pushedToGoofish",
      header: "闲管家同步",
      cell: ({ row }) => (
        <Badge variant={row.original.pushedToGoofish ? "default" : "secondary"}>
          {row.original.pushedToGoofish ? "已推送" : "仅本地"}
        </Badge>
      ),
    },
    {
      accessorKey: "purchasedAt",
      header: "采购时间",
      cell: ({ row }) => new Date(row.original.purchasedAt).toLocaleString("zh-CN", { hour12: false }),
    },
  ];

  const supplierCols: ColumnDef<Supplier>[] = [
    { accessorKey: "name", header: "供应商名称" },
    { accessorKey: "channel", header: "采购渠道" },
    { accessorKey: "contact", header: "联系方式" },
    { accessorKey: "remark", header: "备注" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">采购批次台账与供应商</h2>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          新增供应商
        </Button>
      </div>

      <Tabs defaultValue="batches">
        <TabsList>
          <TabsTrigger value="batches">采购批次 ({batches.length})</TabsTrigger>
          <TabsTrigger value="suppliers">供应商名录 ({suppliers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="batches" className="pt-3">
          <DataTable
            columns={batchCols}
            data={batches}
            searchKey="kindName"
            searchPlaceholder="按卡种名称筛选..."
          />
        </TabsContent>

        <TabsContent value="suppliers" className="pt-3">
          <DataTable
            columns={supplierCols}
            data={suppliers}
            searchKey="name"
            searchPlaceholder="按供应商筛选..."
          />
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新增供应商</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSupplier} className="space-y-4">
            <div className="space-y-1.5">
              <Label>供应商名称</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>采购渠道（如：货源站 / 微信 / QQ）</Label>
              <Input value={channel} onChange={(e) => setChannel(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>联系方式</Label>
              <Input value={contact} onChange={(e) => setContact(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>备注</Label>
              <Input value={remark} onChange={(e) => setRemark(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="submit">保存供应商</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
