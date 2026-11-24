"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { fenToYuan, unixToStr } from "@/lib/format";
import { RefreshCw, TrendingUp, Wallet, KeyRound, ShoppingBag } from "lucide-react";
import Link from "next/link";

interface DashboardData {
  kpi: {
    shopCount: number;
    orderCount: number;
    pendingShipCount: number;
    pendingRefundCount: number;
    totalKamiStock: number;
    totalRevenueFen: number;
    totalCostFen: number;
    totalProfitFen: number;
    totalPurchaseFen: number;
  };
  lowStockKinds: Array<{
    id: number;
    kindId: string;
    kindName: string;
    stock: number;
    stockWarning: number;
  }>;
  expiringShops: Array<{
    id: number;
    shopName: string;
    userName: string;
    authorizeExpires: number;
  }>;
  trend: Array<{
    date: string;
    revenue: number;
    cost: number;
    profit: number;
  }>;
  logs: Array<{
    id: number;
    action: string;
    target: string;
    status: string;
    message: string;
    createdAt: string;
  }>;
}

const chartConfig = {
  revenue: { label: "实付营收", color: "var(--chart-1)" },
  cost: { label: "发卡成本", color: "var(--chart-2)" },
  profit: { label: "净毛利", color: "var(--chart-3)" },
} satisfies ChartConfig;

export default function DashboardPage() {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      if (json.ok) setData(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const kpi = data?.kpi;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold tracking-tight">仪表盘</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className="mr-1.5 h-4 w-4" />
            刷新
          </Button>
          <Button size="sm" render={<Link href="/kami" />}>
            采购入库
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">累计实付营收</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fenToYuan(kpi?.totalRevenueFen)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              订单 {kpi?.orderCount ?? 0} · 采购 {fenToYuan(kpi?.totalPurchaseFen)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">净毛利润</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fenToYuan(kpi?.totalProfitFen)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              成本 {fenToYuan(kpi?.totalCostFen)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">卡密库存</CardTitle>
            <KeyRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi?.totalKamiStock ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              低库存 {data?.lowStockKinds.length ?? 0} 个
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">待处理履约</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi?.pendingShipCount ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              待处理售后 {kpi?.pendingRefundCount ?? 0} · 店铺 {kpi?.shopCount ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-base">近 7 日营收趋势（元）</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[260px] w-full">
              <BarChart data={data?.trend ?? []}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                <Bar dataKey="cost" fill="var(--color-cost)" radius={4} />
                <Bar dataKey="profit" fill="var(--color-profit)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">预警与动态</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {(data?.expiringShops ?? []).map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm border-b pb-2">
                  <span className="truncate font-medium">店铺授权到期：{s.shopName || s.userName}</span>
                  <Badge variant="destructive">{unixToStr(s.authorizeExpires)}</Badge>
                </div>
              ))}
              {(data?.lowStockKinds ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无低库存卡种</p>
              ) : (
                data?.lowStockKinds.map((k) => (
                  <div key={k.kindId} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                    <span className="truncate font-medium">{k.kindName}</span>
                    <Badge variant={k.stock === 0 ? "destructive" : "secondary"}>
                      余 {k.stock}
                    </Badge>
                  </div>
                ))
              )}
            </div>

            <div className="border-t pt-3 space-y-2">
              {(data?.logs ?? []).slice(0, 4).map((l) => (
                <div key={l.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-muted-foreground">{l.message}</span>
                  <Badge variant={l.status === "SUCCESS" ? "outline" : "destructive"}>
                    {l.status === "SUCCESS" ? "成功" : "失败"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
