import { NextResponse } from "next/server";
import { fromCaught, jsonError } from "@/lib/api/http";
import { requireProjectEditor } from "@/lib/api/projects";
import { generateConceptForProject } from "@/lib/creative/generate";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { projectId?: string };
    if (!body.projectId) {
      return jsonError("Save the brief before creating a concept.", 400);
    }
    const ctx = await requireProjectEditor(body.projectId);
    const concept = await generateConceptForProject(ctx.db, {
      projectId: ctx.project.id,
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
    });
    return NextResponse.json({ concept });
  } catch (error) {
    return fromCaught(error);
  }
}
