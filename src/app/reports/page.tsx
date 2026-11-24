"use client";

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { fenToYuan } from "@/lib/format";

interface ProductStat {
  productId: string;
  title: string;
  orderCount: number;
  qty: number;
  revenueFen: number;
  costFen: number;
  refundFen: number;
  netProfitFen: number;
}

interface SupplierStat {
  supplierName: string;
  batchCount: number;
  quantity: number;
  totalCostFen: number;
}

export default function ReportsPage() {
  const [summary, setSummary] = React.useState({
    orderCount: 0,
    totalRevenueFen: 0,
    totalCostFen: 0,
    totalRefundFen: 0,
    netProfitFen: 0,
  });
  const [byProduct, setByProduct] = React.useState<ProductStat[]>([]);
  const [bySupplier, setBySupplier] = React.useState<SupplierStat[]>([]);

  React.useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) {
          setSummary(json.data.summary);
          setByProduct(json.data.byProduct);
          setBySupplier(json.data.bySupplier);
        }
      });
  }, []);

  const productCols: ColumnDef<ProductStat>[] = [
    { accessorKey: "title", header: "商品" },
    { accessorKey: "orderCount", header: "订单数" },
    { accessorKey: "qty", header: "销量" },
    { accessorKey: "revenueFen", header: "实付营收", cell: ({ row }) => fenToYuan(row.original.revenueFen) },
    { accessorKey: "costFen", header: "发卡成本", cell: ({ row }) => fenToYuan(row.original.costFen) },
    { accessorKey: "refundFen", header: "已退款", cell: ({ row }) => fenToYuan(row.original.refundFen) },
    {
      accessorKey: "netProfitFen",
      header: "净利润",
      cell: ({ row }) => (
        <span className={row.original.netProfitFen >= 0 ? "text-emerald-600 font-medium" : "text-destructive"}>
          {fenToYuan(row.original.netProfitFen)}
        </span>
      ),
    },
  ];

  const supplierCols: ColumnDef<SupplierStat>[] = [
    { accessorKey: "supplierName", header: "供应商" },
    { accessorKey: "batchCount", header: "采购批次数" },
    { accessorKey: "quantity", header: "采购卡密数" },
    { accessorKey: "totalCostFen", header: "采购总额", cell: ({ row }) => fenToYuan(row.original.totalCostFen) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">经营报表</h2>
        <Button render={<a href="/api/reports?format=csv" download />}>
          <Download className="mr-1.5 h-4 w-4" />
          导出订单 CSV
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">实付总额</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{fenToYuan(summary.totalRevenueFen)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">总成本</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{fenToYuan(summary.totalCostFen)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">已退款</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{fenToYuan(summary.totalRefundFen)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">净利润</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-emerald-600">
            {fenToYuan(summary.netProfitFen)}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="product">
        <TabsList>
          <TabsTrigger value="product">按商品利润 ({byProduct.length})</TabsTrigger>
          <TabsTrigger value="supplier">按供应商采购 ({bySupplier.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="product" className="pt-3">
          <DataTable columns={productCols} data={byProduct} searchKey="title" searchPlaceholder="搜索商品..." />
        </TabsContent>
        <TabsContent value="supplier" className="pt-3">
          <DataTable columns={supplierCols} data={bySupplier} searchKey="supplierName" searchPlaceholder="搜索供应商..." />
        </TabsContent>
      </Tabs>
    </div>
  );
}
