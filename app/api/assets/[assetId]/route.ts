import { fromCaught } from "@/lib/api/http";
import { streamPrivateAsset } from "@/lib/api/assets";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ assetId: string }> },
) {
  try {
    const { assetId } = await context.params;
    return await streamPrivateAsset(assetId, request);
  } catch (error) {
    return fromCaught(error);
  }
}

export async function HEAD(
  request: Request,
  context: { params: Promise<{ assetId: string }> },
) {
  try {
    const { assetId } = await context.params;
    return await streamPrivateAsset(assetId, request);
  } catch (error) {
    return fromCaught(error);
  }
}
