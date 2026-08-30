import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getWorkspaceObject } from "@/lib/r2/bucket";
import { verifyProviderObjectToken, workspaceIdFromObjectKey } from "@/lib/r2/provider-href";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const { env } = await getCloudflareContext({ async: true });
  const secret = String((env as { INTERNAL_SERVICE_SECRET?: string }).INTERNAL_SERVICE_SECRET ?? "").trim();
  const verified = secret ? verifyProviderObjectToken(secret, token) : null;
  const workspaceId = verified ? workspaceIdFromObjectKey(verified.objectKey) : null;
  if (!verified || !workspaceId) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const object = await getWorkspaceObject(env.MEDIA_BUCKET, workspaceId, verified.objectKey);
  if (!object) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const bytes = await object.arrayBuffer();
  if (bytes.byteLength === 0) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
      "Cache-Control": "private, max-age=60",
    },
  });
}
