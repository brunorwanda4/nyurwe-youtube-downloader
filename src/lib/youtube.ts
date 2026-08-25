const ALLOWED_HOSTS = ["youtube.com", "m.youtube.com", "youtu.be", "music.youtube.com"];

export function youtubeLink(value: string) {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.replace(/^www\./, "");
    return parsed.protocol === "https:" && ALLOWED_HOSTS.includes(host);
  } catch { return false; }
}
