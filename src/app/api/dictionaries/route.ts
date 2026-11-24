import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api-helper";
import {
  getAllErrorTips,
  getAreas,
  getCities,
  getProvinces,
} from "@/lib/goofish/dictionaries";

export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get("type") || "provinces";
    if (type === "provinces") {
      return ok({ list: getProvinces() });
    }
    if (type === "cities") {
      const provId = Number(req.nextUrl.searchParams.get("provId") || 0);
      return ok({ list: getCities(provId) });
    }
    if (type === "areas") {
      const cityId = Number(req.nextUrl.searchParams.get("cityId") || 0);
      return ok({ list: getAreas(cityId) });
    }
    if (type === "errorTips") {
      return ok({ list: getAllErrorTips() });
    }
    return fail("不支持的字典类型", 400);
  } catch (e) {
    return fail(e, 500);
  }
}
