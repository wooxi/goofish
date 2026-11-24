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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader } from "@/components/image-uploader";
import { toast } from "sonner";
import { RefreshCw, Check, X, Eye } from "lucide-react";
import { fenToYuan, REFUND_STATUS_MAP, unixToStr } from "@/lib/format";

interface RefundRow {
  id: number;
  refundNo: string;
  orderNo: string;
  refundType: number;
  refundStatus: number;
  applyAmountFen: number;
  refundAmountFen: number;
  applyTime: number;
  timeoutTime: number;
  refundReason: string;
}

export default function RefundsPage() {
  const [list, setList] = React.useState<RefundRow[]>([]);
  const [syncing, setSyncing] = React.useState(false);
  const [statusTab, setStatusTab] = React.useState("ALL");
  const [agreeTarget, setAgreeTarget] = React.useState<RefundRow | null>(null);

  const [refuseTarget, setRefuseTarget] = React.useState<RefundRow | null>(null);
  const [refuseReason, setRefuseReason] = React.useState("");
  const [refuseExplain, setRefuseExplain] = React.useState("");
  const [refuseImages, setRefuseImages] = React.useState<string[]>([]);

  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailData, setDetailData] = React.useState<Record<string, unknown> | null>(null);

  const load = React.useCallback(async () => {
    const res = await fetch("/api/refunds");
    const json = await res.json();
    if (json.ok) setList(json.data.list);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const filteredList = React.useMemo(() => {
    if (statusTab === "ALL") return list;
    return list.filter((r) => String(r.refundStatus) === statusTab);
  }, [list, statusTab]);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync", page_no: 1, page_size: 50 }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      toast.success(`已同步 ${json.data.synced} 条售后单`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "同步失败");
    } finally {
      setSyncing(false);
    }
  }

  async function handleAgree() {
    if (!agreeTarget) return;
    try {
      const res = await fetch("/api/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "agree", order_no: agreeTarget.orderNo }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      toast.success("已同意退款");
      setAgreeTarget(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "操作失败");
    }
  }

  async function handleRefuse(e: React.FormEvent) {
    e.preventDefault();
    if (!refuseTarget) return;
    try {
      const res = await fetch("/api/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "refuse",
          order_no: refuseTarget.orderNo,
          refuse_reason: refuseReason,
          refuse_explain: refuseExplain,
          refuse_images: refuseImages.map((src) => ({
            src,
            size: 102400,
            width: 800,
            height: 800,
          })),
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      toast.success("已拒绝退款");
      setRefuseTarget(null);
      setRefuseReason("");
      setRefuseExplain("");
      setRefuseImages([]);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "操作失败");
    }
  }

  async function handleOpenDetail(row: RefundRow) {
    setDetailOpen(true);
    setDetailData(null);
    try {
      const res = await fetch("/api/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "detail", order_no: row.orderNo }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setDetailData(json.data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "获取详情失败");
    }
  }

  const columns: ColumnDef<RefundRow>[] = [
    { accessorKey: "refundNo", header: "退款单号" },
    { accessorKey: "orderNo", header: "订单号" },
    {
      accessorKey: "refundType",
      header: "类型",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.refundType === 1 ? "仅退款" : "退货退款"}</Badge>
      ),
    },
    {
      accessorKey: "refundStatus",
      header: "状态",
      cell: ({ row }) => {
        const meta = REFUND_STATUS_MAP[row.original.refundStatus] ?? {
          label: String(row.original.refundStatus),
          variant: "outline" as const,
        };
        return <Badge variant={meta.variant}>{meta.label}</Badge>;
      },
    },
    {
      accessorKey: "applyAmountFen",
      header: "申请金额",
      cell: ({ row }) => fenToYuan(row.original.applyAmountFen),
    },
    { accessorKey: "refundReason", header: "退款原因" },
    {
      accessorKey: "applyTime",
      header: "申请时间",
      cell: ({ row }) => unixToStr(row.original.applyTime),
    },
    {
      id: "actions",
      header: "操作",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" onClick={() => handleOpenDetail(row.original)}>
            <Eye className="mr-1 h-3.5 w-3.5" />
            详情
          </Button>
          {row.original.refundStatus === 1 && (
            <>
              <Button size="sm" variant="destructive" onClick={() => setAgreeTarget(row.original)}>
                <Check className="mr-1 h-3.5 w-3.5" />
                同意
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setRefuseTarget(row.original);
                  setRefuseReason("");
                  setRefuseExplain("");
                  setRefuseImages([]);
                }}
              >
                <X className="mr-1 h-3.5 w-3.5" />
                拒绝
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">售后退款</h2>
        <Button onClick={handleSync} disabled={syncing}>
          <RefreshCw className={`mr-1.5 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "同步中..." : "同步售后单"}
        </Button>
      </div>

      <Tabs value={statusTab} onValueChange={setStatusTab}>
        <TabsList>
          <TabsTrigger value="ALL">全部 ({list.length})</TabsTrigger>
          <TabsTrigger value="1">待处理 ({list.filter((r) => r.refundStatus === 1).length})</TabsTrigger>
          <TabsTrigger value="2">待退货 ({list.filter((r) => r.refundStatus === 2).length})</TabsTrigger>
          <TabsTrigger value="3">待收货 ({list.filter((r) => r.refundStatus === 3).length})</TabsTrigger>
          <TabsTrigger value="5">退款成功 ({list.filter((r) => r.refundStatus === 5).length})</TabsTrigger>
          <TabsTrigger value="6">已拒绝 ({list.filter((r) => r.refundStatus === 6).length})</TabsTrigger>
          <TabsTrigger value="4">已关闭 ({list.filter((r) => r.refundStatus === 4).length})</TabsTrigger>
        </TabsList>
      </Tabs>

      <DataTable
        columns={columns}
        data={filteredList}
        searchKey="orderNo"
        searchPlaceholder="搜索订单号..."
      />

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>售后详情</SheetTitle>
          </SheetHeader>
          {detailData ? (
            <div className="mt-4 space-y-2 rounded-lg border p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">退款单号</span>
                <span>{String(detailData.refund_no)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">订单号</span>
                <span>{String(detailData.order_no)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">申请金额</span>
                <span>{fenToYuan(Number(detailData.apply_amount))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">已退金额</span>
                <span>{fenToYuan(Number(detailData.refund_amount))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">超时时间</span>
                <span>{unixToStr(Number(detailData.timeout_time))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">原因</span>
                <span className="text-right max-w-xs">{String(detailData.refund_reason || "-")}</span>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-sm text-muted-foreground">加载中...</div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={Boolean(refuseTarget)} onOpenChange={(o) => !o && setRefuseTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>拒绝退款：{refuseTarget?.orderNo}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRefuse} className="space-y-4">
            <div className="space-y-1.5">
              <Label>拒绝原因</Label>
              <Input value={refuseReason} onChange={(e) => setRefuseReason(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>拒绝说明</Label>
              <Textarea rows={3} value={refuseExplain} onChange={(e) => setRefuseExplain(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>举证图片</Label>
              <ImageUploader value={refuseImages} onChange={setRefuseImages} multiple />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRefuseTarget(null)}>
                取消
              </Button>
              <Button type="submit">确认拒绝</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(agreeTarget)} onOpenChange={(o) => !o && setAgreeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认同意退款？</AlertDialogTitle>
            <AlertDialogDescription>
              订单号：{agreeTarget?.orderNo}，金额：{fenToYuan(agreeTarget?.applyAmountFen)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleAgree}>确认同意</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
