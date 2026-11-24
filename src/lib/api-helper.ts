import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function fail(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function writeSyncLog(
  action: string,
  target: string,
  status: "SUCCESS" | "ERROR",
  message: string,
  detail?: unknown
) {
  try {
    await prisma.syncLog.create({
      data: {
        action,
        target,
        status,
        message,
        detailJson: detail ? JSON.stringify(detail) : "{}",
      },
    });
  } catch {
    // ignore log failure
  }
}
