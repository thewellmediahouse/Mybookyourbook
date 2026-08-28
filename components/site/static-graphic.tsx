/* Public pack files are already compressed. Serve them as static files on Workers. */
/* eslint-disable @next/next/no-img-element */
import type { ImgHTMLAttributes } from "react";

export function StaticGraphic({ alt = "", ...props }: ImgHTMLAttributes<HTMLImageElement> & { alt?: string }) {
  return <img alt={alt} {...props} />;
}
