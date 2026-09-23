import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { listAuditLogs } from "@/lib/services/audit";
import { okPage, handleApiError } from "@/lib/api";
import { parseListParams } from "@/lib/pagination";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    await requirePermission("audit.view");
    const { searchParams } = new URL(req.url);
    const params = parseListParams(searchParams);
    const page = await listAuditLogs(params.limit, searchParams.get("cursor"));
    return okPage(page.items, page.nextCursor);
  } catch (e) {
    return handleApiError(e);
  }
}
