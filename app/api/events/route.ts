import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/guards";
import { listEventsForUser, createEvent } from "@/lib/services/events";
import { ok, okPage, handleApiError } from "@/lib/api";
import { eventCreateSchema, eventStatusSchema, parseBody } from "@/lib/validation";
import { parseListParams } from "@/lib/pagination";
import { type EventInput } from "@/lib/workflows/events";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await requirePermission("events.view");
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const status = statusParam ? parseBody(eventStatusSchema, statusParam) : null;
    const params = parseListParams(searchParams);

    const page = await listEventsForUser(user, params, status);
    return okPage(page.items, page.nextCursor, page.total);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await requirePermission("events.create");
    const body = await req.json();
    const input = parseBody(eventCreateSchema, body) as EventInput;

    const event = await createEvent(user, input);
    return ok(event, 201);
  } catch (e) {
    return handleApiError(e);
  }
}
