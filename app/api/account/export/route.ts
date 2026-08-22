import { NextResponse } from "next/server";
import { fromCaught } from "@/lib/api/http";
import { requireApiSession } from "@/lib/api/auth";
import { getDb } from "@/lib/db/client";
import { EXPORT_FILENAME } from "@/lib/security/copy";
import { exportAccountData } from "@/lib/security/export";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireApiSession();
    const payload = await exportAccountData(await getDb(), session.user.id);
    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="${EXPORT_FILENAME}"`,
        "cache-control": "private, no-store",
      },
    });
  } catch (error) {
    return fromCaught(error);
  }
}
