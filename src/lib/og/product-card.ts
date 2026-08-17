import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { siteConfig } from '@/config/site';
import { safeHttpUrl } from '@/lib/html-safe';

export const PRODUCT_OG_WIDTH = 1200;
export const PRODUCT_OG_HEIGHT = 630;

/** Product occupies this share of the frame so slight social crops still look intentional. */
const FIT = 0.86;

export type ProductOgCard = {
  /** Site-relative path, e.g. `/og/products/handle.webp` */
  src: string;
  width: number;
  height: number;
  type: 'image/webp';
};

function outputPaths(handle: string): { relative: string; files: string[] } {
  const relative = `/og/products/${handle}.webp`;
  const fileName = `${handle}.webp`;
  const files = [
    path.join(process.cwd(), 'public', 'og', 'products', fileName),
    path.join(process.cwd(), 'dist', 'og', 'products', fileName),
  ];
  return { relative, files };
}

/**
 * Build a 1200×630 share card: product letterboxed on brand background (not cropped).
 * Returns null when there is no usable image or generation fails.
 */
export async function buildProductOgCard(options: {
  handle: string;
  imageUrl: string | null | undefined;
}): Promise<ProductOgCard | null> {
  const imageUrl = safeHttpUrl(options.imageUrl);
  if (!imageUrl || !options.handle) return null;

  const { relative, files } = outputPaths(options.handle);
  const background = siteConfig.branding.neutrals.background;

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.warn(`[og] Fetch failed (${response.status}) for ${options.handle}`);
      return null;
    }

    const input = Buffer.from(await response.arrayBuffer());
    const maxW = Math.round(PRODUCT_OG_WIDTH * FIT);
    const maxH = Math.round(PRODUCT_OG_HEIGHT * FIT);

    // Drop empty studio margins so the unit isn't tiny inside a double mat.
    // Fall back to the original buffer when trim finds nothing useful.
    let prepared = input;
    try {
      prepared = await sharp(input)
        .trim({
          background: '#ffffff',
          threshold: 18,
        })
        .toBuffer();
    } catch {
      prepared = input;
    }

    const product = await sharp(prepared)
      .resize(maxW, maxH, { fit: 'inside', withoutEnlargement: false })
      .ensureAlpha()
      .png()
      .toBuffer({ resolveWithObject: true });

    const left = Math.round((PRODUCT_OG_WIDTH - product.info.width) / 2);
    const top = Math.round((PRODUCT_OG_HEIGHT - product.info.height) / 2);

    const card = await sharp({
      create: {
        width: PRODUCT_OG_WIDTH,
        height: PRODUCT_OG_HEIGHT,
        channels: 3,
        background,
      },
    })
      .composite([{ input: product.data, left, top }])
      .webp({ quality: 86 })
      .toBuffer();

    await Promise.all(
      files.map(async (file) => {
        await fs.mkdir(path.dirname(file), { recursive: true });
        await fs.writeFile(file, card);
      }),
    );

    return {
      src: relative,
      width: PRODUCT_OG_WIDTH,
      height: PRODUCT_OG_HEIGHT,
      type: 'image/webp',
    };
  } catch (error) {
    console.warn(`[og] Failed to build product card for ${options.handle}`, error);
    return null;
  }
}
