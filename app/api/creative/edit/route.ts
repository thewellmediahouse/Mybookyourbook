import { NextResponse } from "next/server";
import { requireProjectEditor } from "@/lib/api/projects";
import { fromCaught, jsonError } from "@/lib/api/http";
import { editConcept } from "@/lib/creative/edit";
import type { ConceptScene } from "@/lib/ai/creative-director";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      projectId?: string;
      hook?: string;
      strategy?: string;
      spokenScript?: string;
      scenes?: ConceptScene[];
      callToAction?: string;
    };
    if (!body.projectId) {
      return jsonError("Create a concept before you edit it.", 400);
    }
    const ctx = await requireProjectEditor(body.projectId);
    const concept = await editConcept(ctx.db, {
      projectId: ctx.project.id,
      workspaceId: ctx.workspaceId,
      patch: {
        hook: body.hook,
        strategy: body.strategy,
        spokenScript: body.spokenScript,
        scenes: body.scenes,
        callToAction: body.callToAction,
      },
    });
    return NextResponse.json({ concept });
  } catch (error) {
    return fromCaught(error);
  }
}
