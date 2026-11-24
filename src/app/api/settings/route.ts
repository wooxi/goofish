import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { fail, ok, writeSyncLog } from "@/lib/api-helper";
import { goofishApi } from "@/lib/goofish/client";

const settingsSchema = z.object({
  appKey: z.string().trim().min(1, "AppKey 不能为空"),
  appSecret: z.string().trim().optional().default(""),
  sellerId: z.string().trim().optional().default(""),
  baseUrl: z.string().trim().url().optional().default("https://open.goofish.pro"),
  imgbedUrl: z.string().trim().optional().default(""),
  imgbedAuthCode: z.string().trim().optional().default(""),
});

export async function GET() {
  try {
    const rows = await prisma.appSetting.findMany();
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return ok({
      appKey: map.goofish_app_key ?? "",
      hasSecret: Boolean(map.goofish_app_secret),
      appSecretMasked: map.goofish_app_secret
        ? `${map.goofish_app_secret.slice(0, 4)}****${map.goofish_app_secret.slice(-4)}`
        : "",
      sellerId: map.goofish_seller_id ?? "",
      baseUrl: map.goofish_base_url ?? "https://open.goofish.pro",
      imgbedUrl: map.imgbed_url ?? "",
      hasImgbedAuth: Boolean(map.imgbed_auth_code),
    });
  } catch (e) {
    return fail(e, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = settingsSchema.parse(body);

    const existingSecret = await prisma.appSetting.findUnique({
      where: { key: "goofish_app_secret" },
    });
    if (!parsed.appSecret && !existingSecret?.value) {
      return fail("AppSecret 不能为空", 400);
    }

    const entries: Array<[string, string]> = [
      ["goofish_app_key", parsed.appKey],
      ["goofish_seller_id", parsed.sellerId],
      ["goofish_base_url", parsed.baseUrl],
      ["imgbed_url", parsed.imgbedUrl],
    ];
    if (parsed.appSecret) {
      entries.push(["goofish_app_secret", parsed.appSecret]);
    }
    if (parsed.imgbedAuthCode) {
      entries.push(["imgbed_auth_code", parsed.imgbedAuthCode]);
    }

    for (const [key, value] of entries) {
      await prisma.appSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }

    await writeSyncLog("SETTINGS_SAVE", "AppSetting", "SUCCESS", "已更新系统配置");
    return ok({ saved: true });
  } catch (e) {
    return fail(e, 400);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const useOverride = Boolean(body?.appKey && body?.appSecret);
    const data = useOverride
      ? await goofishApi.listShops({
          appKey: String(body.appKey),
          appSecret: String(body.appSecret),
          sellerId: body.sellerId ? String(body.sellerId) : undefined,
          baseUrl: body.baseUrl ? String(body.baseUrl) : undefined,
        })
      : await goofishApi.listShops();

    await writeSyncLog("TEST_CONNECTION", "Shop", "SUCCESS", `连通成功，检测到 ${data.list.length} 个店铺`);
    return ok({ shopCount: data.list.length, shops: data.list });
  } catch (e) {
    await writeSyncLog("TEST_CONNECTION", "Shop", "ERROR", e instanceof Error ? e.message : String(e));
    return fail(e, 400);
  }
}
