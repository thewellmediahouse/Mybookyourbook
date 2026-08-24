export function MediaPreview({
  src,
  mimeType,
  alt,
  className,
}: {
  src: string;
  mimeType?: string;
  alt: string;
  className?: string;
}) {
  if (mimeType?.startsWith("video/")) {
    return <video src={src} className={className} controls playsInline preload="metadata" />;
  }
  return (
    // Private studio file; cookies must be sent.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} />
  );
}

export function privateAssetSrc(assetId: string, updatedAt?: number): string {
  const stamp = updatedAt ?? Date.now();
  return `/api/assets/${assetId}?v=${stamp}`;
}
