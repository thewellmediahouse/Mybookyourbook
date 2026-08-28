/* SVGs from the homepage pack stay as static files; next/image is for photographs. */
/* eslint-disable @next/next/no-img-element */
import type { ImgHTMLAttributes } from "react";

export function StaticGraphic({ alt = "", ...props }: ImgHTMLAttributes<HTMLImageElement> & { alt?: string }) {
  return <img alt={alt} {...props} />;
}
