import regionsData from "./regions.json";
import errorTipsData from "./error-tips.json";

export interface RegionRecord {
  provId: number;
  provName: string;
  cityId: number;
  cityName: string;
  areaId: number;
  areaName: string;
}

export interface ErrorTipRecord {
  id: number;
  errCode: string;
  errSubCode: string;
  errMsg: string;
  content: string;
}

const regions = regionsData as RegionRecord[];
const errorTips = errorTipsData as ErrorTipRecord[];

export function getProvinces(): Array<{ id: number; name: string }> {
  const map = new Map<number, string>();
  for (const r of regions) {
    if (!map.has(r.provId)) map.set(r.provId, r.provName);
  }
  return Array.from(map.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.id - b.id);
}

export function getCities(provId: number): Array<{ id: number; name: string }> {
  const map = new Map<number, string>();
  for (const r of regions) {
    if (r.provId === provId && !map.has(r.cityId)) {
      map.set(r.cityId, r.cityName);
    }
  }
  return Array.from(map.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.id - b.id);
}

export function getAreas(cityId: number): Array<{ id: number; name: string }> {
  const map = new Map<number, string>();
  for (const r of regions) {
    if (r.cityId === cityId && !map.has(r.areaId)) {
      map.set(r.areaId, r.areaName);
    }
  }
  return Array.from(map.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.id - b.id);
}

export function matchGoofishErrorTip(errCode?: string, errMsg?: string): ErrorTipRecord | null {
  const code = (errCode || "").trim();
  const msg = (errMsg || "").trim();
  if (!code && !msg) return null;

  for (const tip of errorTips) {
    if (tip.errSubCode && (msg.includes(tip.errSubCode) || code === tip.errSubCode)) {
      return tip;
    }
  }
  for (const tip of errorTips) {
    if (tip.errCode && code === tip.errCode) {
      return tip;
    }
  }
  for (const tip of errorTips) {
    if (tip.errMsg && msg && msg.includes(tip.errMsg)) {
      return tip;
    }
  }
  return null;
}

export function getAllErrorTips(): ErrorTipRecord[] {
  return errorTips;
}
