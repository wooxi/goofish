import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api-helper";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return fail("请选择图片文件", 400);
    }

    const rows = await prisma.appSetting.findMany({
      where: { key: { in: ["imgbed_url", "imgbed_auth_code"] } },
    });
    const map = new Map(rows.map((r) => [r.key, r.value]));
    const baseUrl = (map.get("imgbed_url") || "").replace(/\/$/, "");
    const authCode = map.get("imgbed_auth_code") || "";

    if (!baseUrl || !authCode) {
      return fail("请先在「系统设置」配置图床地址与认证码", 400);
    }

    const params = new URLSearchParams({
      authCode,
      returnFormat: "full",
      responseFormat: "object",
    });

    const uploadBody = new FormData();
    uploadBody.append("file", file, file.name);

    const resp = await fetch(`${baseUrl}/upload?${params.toString()}`, {
      method: "POST",
      body: uploadBody,
    });

    const text = await resp.text();
    if (!resp.ok) {
      return fail(`图床上传失败 (${resp.status}): ${text}`, 400);
    }

    const json = JSON.parse(text) as { src?: string; publicUrl?: string; error?: string };
    let url = json.publicUrl || json.src || "";
    if (!url) {
      return fail(json.error || "图床未返回图片地址", 400);
    }

    if (url.startsWith("/")) {
      url = `${baseUrl}${url}`;
    } else if (baseUrl.startsWith("https://") && url.startsWith("http://")) {
      url = `https://${url.slice("http://".length)}`;
    }

    return ok({ url });
  } catch (e) {
    return fail(e, 400);
  }
}
