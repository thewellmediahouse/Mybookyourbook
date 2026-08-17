export type VideoEmbedKind = 'youtube' | 'vimeo' | 'file';

export interface ParsedVideoUrl {
  kind: VideoEmbedKind;
  id: string;
  embedUrl: string;
  thumbnailUrl?: string;
}

const YOUTUBE_ID =
  /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

const VIMEO_ID = /(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/;

const FILE_EXT = /\.(mp4|webm|ogg|mov)(\?|$)/i;

export function parseVideoUrl(url: string): ParsedVideoUrl | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const youtubeMatch = trimmed.match(YOUTUBE_ID);
  if (youtubeMatch) {
    const id = youtubeMatch[1];
    return {
      kind: 'youtube',
      id,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`,
      thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
  }

  const vimeoMatch = trimmed.match(VIMEO_ID);
  if (vimeoMatch) {
    const id = vimeoMatch[1];
    return {
      kind: 'vimeo',
      id,
      embedUrl: `https://player.vimeo.com/video/${id}?autoplay=1`,
    };
  }

  if (FILE_EXT.test(trimmed)) {
    return {
      kind: 'file',
      id: trimmed,
      embedUrl: trimmed,
    };
  }

  return null;
}

/** True when the string is a playable video URL rather than an image path. */
export function isVideoUrl(url: string): boolean {
  return parseVideoUrl(url) !== null;
}

export function resolveVideoUrl(explicitUrl?: string, fallbackSrc?: string): string | undefined {
  if (explicitUrl?.trim()) return explicitUrl.trim();
  if (fallbackSrc && isVideoUrl(fallbackSrc)) return fallbackSrc.trim();
  return undefined;
}

export function resolvePosterSrc(
  posterSrc: string | undefined,
  videoUrl: string | undefined,
  parsed: ParsedVideoUrl | null,
  fallback = '/images/video-placeholder.svg',
): string {
  if (posterSrc && !isVideoUrl(posterSrc)) return posterSrc;

  const parsedFromUrl = parsed ?? (videoUrl ? parseVideoUrl(videoUrl) : null);
  if (parsedFromUrl?.thumbnailUrl) return parsedFromUrl.thumbnailUrl;

  return fallback;
}

/** Poster for inline video: custom thumbnail → platform thumb → optional fallback image. */
export function resolveVideoPosterSrc(options: {
  thumbnail?: string;
  videoUrl?: string;
  fallbackImage?: string;
  fallback?: string;
}): string {
  const { thumbnail, videoUrl, fallbackImage, fallback = '/images/video-placeholder.svg' } = options;
  const parsed = videoUrl ? parseVideoUrl(videoUrl) : null;
  return resolvePosterSrc(thumbnail, videoUrl, parsed, resolvePosterSrc(fallbackImage, videoUrl, parsed, fallback));
}
