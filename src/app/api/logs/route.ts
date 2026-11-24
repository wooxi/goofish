import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/api-helper";

export async function GET() {
  try {
    const logs = await prisma.syncLog.findMany({
      orderBy: { id: "desc" },
      take: 200,
    });
    return ok({ list: logs });
  } catch (e) {
    return fail(e, 500);
  }
}
