/** Only public newsletter identity is needed for Buttondown's native HTML form. */
export function buttondownConfig(value = "stockwatch") {
  const username = typeof value === "string" ? value.trim() : "";
  if (!username) return null;
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(username)) {
    throw new Error("PUBLIC_BUTTONDOWN_USERNAME must be a username, not a URL or API key");
  }
  return {
    username,
    subscribeUrl: `https://buttondown.com/api/emails/embed-subscribe/${encodeURIComponent(username)}`,
    archiveUrl: `https://buttondown.com/${encodeURIComponent(username)}`,
  };
}
