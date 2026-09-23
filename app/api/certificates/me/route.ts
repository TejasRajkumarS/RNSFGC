import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { listMyCertificates } from "@/lib/services/certificates";
import { ok, handleApiError } from "@/lib/api";

export async function GET(): Promise<NextResponse> {
  try {
    const user = await requirePermission("certificates.view");
    const certificates = await listMyCertificates(user.uid);
    return ok(certificates);
  } catch (e) {
    return handleApiError(e);
  }
}
