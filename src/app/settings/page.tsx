"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, Save, PlugZap } from "lucide-react";

export default function SettingsPage() {
  const [appKey, setAppKey] = React.useState("");
  const [appSecret, setAppSecret] = React.useState("");
  const [maskedSecret, setMaskedSecret] = React.useState("");
  const [sellerId, setSellerId] = React.useState("");
  const [baseUrl, setBaseUrl] = React.useState("https://open.goofish.pro");
  const [imgbedUrl, setImgbedUrl] = React.useState("");
  const [imgbedAuthCode, setImgbedAuthCode] = React.useState("");
  const [hasImgbedAuth, setHasImgbedAuth] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [origin, setOrigin] = React.useState("");

  React.useEffect(() => {
    setOrigin(window.location.origin);
    fetch("/api/settings")
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) {
          setAppKey(res.data.appKey || "");
          setMaskedSecret(res.data.appSecretMasked || "");
          setSellerId(res.data.sellerId || "");
          setBaseUrl(res.data.baseUrl || "https://open.goofish.pro");
          setImgbedUrl(res.data.imgbedUrl || "");
          setHasImgbedAuth(Boolean(res.data.hasImgbedAuth));
        }
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!appKey.trim() || (!appSecret.trim() && !maskedSecret)) {
      toast.error("请填写 AppKey 与 AppSecret");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appKey,
          appSecret,
          sellerId,
          baseUrl,
          imgbedUrl,
          imgbedAuthCode,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      toast.success("已保存");
      if (appSecret) {
        setMaskedSecret(`${appSecret.slice(0, 4)}****${appSecret.slice(-4)}`);
        setAppSecret("");
      }
      if (imgbedAuthCode) {
        setHasImgbedAuth(true);
        setImgbedAuthCode("");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appKey && appSecret ? { appKey, appSecret, sellerId, baseUrl } : {}),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      toast.success(`连通成功：${json.data.shopCount} 个店铺`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "连通失败");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>闲管家开放平台</CardTitle>
              {maskedSecret && (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  已配置
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="appKey">AppKey</Label>
              <Input id="appKey" value={appKey} onChange={(e) => setAppKey(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="appSecret">
                AppSecret {maskedSecret && `(${maskedSecret})`}
              </Label>
              <Input
                id="appSecret"
                type="password"
                placeholder={maskedSecret ? "留空保持原密钥" : ""}
                value={appSecret}
                onChange={(e) => setAppSecret(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellerId">seller_id</Label>
              <Input id="sellerId" value={sellerId} onChange={(e) => setSellerId(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseUrl">接口域名</Label>
              <Input id="baseUrl" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>图床配置</CardTitle>
              {hasImgbedAuth && (
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  已配置
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="imgbedUrl">图床域名</Label>
              <Input
                id="imgbedUrl"
                value={imgbedUrl}
                onChange={(e) => setImgbedUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imgbedAuthCode">上传认证码 (authCode)</Label>
              <Input
                id="imgbedAuthCode"
                type="password"
                placeholder={hasImgbedAuth ? "留空保持原认证码" : ""}
                value={imgbedAuthCode}
                onChange={(e) => setImgbedAuthCode(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="submit" disabled={saving}>
                <Save className="mr-1.5 h-4 w-4" />
                {saving ? "保存中..." : "保存配置"}
              </Button>
              <Button type="button" variant="outline" onClick={handleTest} disabled={testing}>
                <PlugZap className="mr-1.5 h-4 w-4" />
                {testing ? "测试中..." : "测试闲管家连通"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">推送回调地址</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">商品回调 / 推送</Label>
            <Input readOnly value={`${origin}/api/webhooks/goofish/product`} className="font-mono text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">订单推送</Label>
            <Input readOnly value={`${origin}/api/webhooks/goofish/order`} className="font-mono text-xs" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
