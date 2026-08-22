/** Only invitation accept URLs may be used as post-login destinations. */
export function safeInviteNext(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed.startsWith("/invite/accept")) {
    return null;
  }
  if (trimmed.startsWith("//")) {
    return null;
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed, "https://production30.invalid");
  } catch {
    return null;
  }
  if (parsed.origin !== "https://production30.invalid") {
    return null;
  }
  if (parsed.pathname !== "/invite/accept") {
    return null;
  }
  if (parsed.username || parsed.password || parsed.hash) {
    return null;
  }
  const token = parsed.searchParams.get("token");
  if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
    return null;
  }
  if ([...parsed.searchParams.keys()].some((key) => key !== "token")) {
    return null;
  }
  return `/invite/accept?token=${token.toLowerCase()}`;
}
