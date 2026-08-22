import { fromCaught } from "@/lib/api/http";
import { streamPrivateAsset } from "@/lib/api/assets";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ assetId: string }> },
) {
  try {
    const { assetId } = await context.params;
    return await streamPrivateAsset(assetId);
  } catch (error) {
    return fromCaught(error);
  }
}
