import { NextResponse } from "next/server";
import { requireProjectEditor } from "@/lib/api/projects";
import { fromCaught, jsonError } from "@/lib/api/http";
import { approveConcept } from "@/lib/creative/approve";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { projectId?: string; versionId?: string };
    if (!body.projectId) {
      return jsonError("Create a concept before you approve it.", 400);
    }
    const ctx = await requireProjectEditor(body.projectId);
    const concept = await approveConcept(ctx.db, {
      projectId: ctx.project.id,
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      versionId: body.versionId,
    });
    return NextResponse.json({ concept });
  } catch (error) {
    return fromCaught(error);
  }
}
