"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  KeyRound,
  ShoppingBag,
  Package,
  RotateCcw,
  Store,
  Settings,
  ArrowDownToLine,
  BarChart3,
  ScrollText,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

const NAV_GROUPS = [
  {
    label: "总览",
    items: [{ title: "仪表盘", href: "/", icon: LayoutDashboard }],
  },
  {
    label: "商品",
    items: [{ title: "商品管理", href: "/products", icon: Package }],
  },
  {
    label: "货源",
    items: [
      { title: "卡密库存", href: "/kami", icon: KeyRound },
      { title: "采购与供应商", href: "/purchases", icon: ArrowDownToLine },
    ],
  },
  {
    label: "订单与售后",
    items: [
      { title: "订单与发货", href: "/orders", icon: ShoppingBag },
      { title: "售后退款", href: "/refunds", icon: RotateCcw },
    ],
  },
  {
    label: "报表与系统",
    items: [
      { title: "经营报表", href: "/reports", icon: BarChart3 },
      { title: "授权店铺", href: "/shops", icon: Store },
      { title: "同步日志", href: "/logs", icon: ScrollText },
      { title: "系统设置", href: "/settings", icon: Settings },
    ],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const currentTitle = React.useMemo(() => {
    for (const group of NAV_GROUPS) {
      const found = group.items.find((i) => i.href === pathname);
      if (found) return found.title;
    }
    return "闲管家进销存";
  }, [pathname]);

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b px-4 py-3">
          <div className="flex items-center gap-2 font-semibold tracking-tight">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
              GF
            </div>
            <span className="truncate group-data-[collapsible=icon]:hidden">
              闲管家进销存
            </span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          {NAV_GROUPS.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const active = pathname === item.href;
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          render={<Link href={item.href} />}
                          isActive={active}
                          tooltip={item.title}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-13 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-sm font-medium">{currentTitle}</h1>
        </header>
        <main className="flex-1 p-4 md:p-6 space-y-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
