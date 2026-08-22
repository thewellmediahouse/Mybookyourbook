export type PublicSession = {
  id: string;
  isCurrent: boolean;
  device: string;
  ipAddress: string | null;
  lastActive: string;
  signedIn: string;
};

export function describeUserAgent(userAgent: string | null | undefined): string {
  if (!userAgent?.trim()) {
    return "Unknown device";
  }
  const ua = userAgent;
  const browser = ua.includes("Edg/")
    ? "Edge"
    : ua.includes("Chrome/")
      ? "Chrome"
      : ua.includes("Firefox/")
        ? "Firefox"
        : ua.includes("Safari/")
          ? "Safari"
          : "Browser";
  const device = /Mobile|Android|iPhone|iPad/i.test(ua) ? "mobile" : "desktop";
  return `${browser} on ${device}`;
}

export function formatSessionTime(value: Date | string | number): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
