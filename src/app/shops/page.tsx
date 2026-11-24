"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { unixToStr } from "@/lib/format";

interface ShopRow {
  id: number;
  authorizeId: string;
  userName: string;
  userNick: string;
  shopName: string;
  isPro: boolean;
  isValid: boolean;
  isTrial: boolean;
  isDepositEnough: boolean;
  authorizeExpires: number;
  validEndTime: number;
}

export default function ShopsPage() {
  const [list, setList] = React.useState<ShopRow[]>([]);
  const [syncing, setSyncing] = React.useState(false);

  const load = React.useCallback(async () => {
    const res = await fetch("/api/shops");
    const json = await res.json();
    if (json.ok) setList(json.data.list);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/shops", { method: "POST" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setList(json.data.list);
      toast.success(`已同步 ${json.data.synced} 个闲鱼店铺`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "同步失败");
    } finally {
      setSyncing(false);
    }
  }

  const columns: ColumnDef<ShopRow>[] = [
    { accessorKey: "authorizeId", header: "授权 ID" },
    { accessorKey: "shopName", header: "店铺名称" },
    { accessorKey: "userNick", header: "闲鱼昵称" },
    { accessorKey: "userName", header: "会员名" },
    {
      accessorKey: "isPro",
      header: "鱼小铺",
      cell: ({ row }) => (
        <Badge variant={row.original.isPro ? "default" : "outline"}>
          {row.original.isPro ? "已开通" : "未开通"}
        </Badge>
      ),
    },
    {
      accessorKey: "isValid",
      header: "订购状态",
      cell: ({ row }) => (
        <Badge variant={row.original.isValid ? "default" : "secondary"}>
          {row.original.isValid ? (row.original.isTrial ? "试用中" : "有效") : "已过期"}
        </Badge>
      ),
    },
    {
      accessorKey: "authorizeExpires",
      header: "授权到期",
      cell: ({ row }) => {
        const exp = row.original.authorizeExpires;
        const daysLeft = exp ? Math.ceil((exp - Date.now() / 1000) / 86400) : 0;
        return (
          <Badge variant={daysLeft <= 30 ? "destructive" : "outline"}>
            {unixToStr(exp)} ({daysLeft > 0 ? `余${daysLeft}天` : "已过期"})
          </Badge>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">授权店铺管理</h2>
        <Button onClick={handleSync} disabled={syncing}>
          <RefreshCw className={`mr-1.5 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "同步中..." : "同步闲鱼店铺"}
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={list}
        searchKey="shopName"
        searchPlaceholder="按店铺名称筛选..."
      />
    </div>
  );
}
