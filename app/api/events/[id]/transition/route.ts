import { NextRequest, NextResponse } from "next/server";
import { requireUser, canTransitionEvent } from "@/lib/auth/guards";
import { requireEvent, transitionEvent } from "@/lib/services/events";
import { ok, handleApiError } from "@/lib/api";
import { transitionSchema, parseBody } from "@/lib/validation";
import { type EventWorkflowTransition } from "@/lib/workflows/events";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await req.json();
    const { action } = parseBody(transitionSchema, body) as { action: EventWorkflowTransition };

    const event = await requireEvent(id);

    if (!canTransitionEvent(user, event, action)) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Not authorized for this transition" } },
        { status: 403 }
      );
    }

    const updated = await transitionEvent(user, id, action);
    return ok(updated);
  } catch (e) {
    return handleApiError(e);
  }
}
