"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface LogRow {
  id: number;
  action: string;
  target: string;
  status: string;
  message: string;
  createdAt: string;
}

export default function LogsPage() {
  const [list, setList] = React.useState<LogRow[]>([]);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/logs");
      const json = await res.json();
      if (json.ok) setList(json.data.list);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const columns: ColumnDef<LogRow>[] = [
    {
      accessorKey: "createdAt",
      header: "时间",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString("zh-CN", { hour12: false }),
    },
    { accessorKey: "action", header: "动作" },
    { accessorKey: "target", header: "目标" },
    {
      accessorKey: "status",
      header: "状态",
      cell: ({ row }) => (
        <Badge variant={row.original.status === "SUCCESS" ? "default" : "destructive"}>
          {row.original.status}
        </Badge>
      ),
    },
    { accessorKey: "message", header: "详情" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">同步与操作日志</h2>
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          刷新
        </Button>
      </div>
      <DataTable columns={columns} data={list} searchKey="message" searchPlaceholder="搜索日志内容..." />
    </div>
  );
}
