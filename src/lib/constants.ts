import { Format, Tools, View } from "./types";

export const FORMATS: Format[] = [
  { id: "mp4-1080", title: "MP4", detail: "1080p", mode: "video", quality: "1080" },
  { id: "mp4-720", title: "MP4", detail: "720p", mode: "video", quality: "720" },
  { id: "mp3", title: "MP3", detail: "Audio", mode: "audio", quality: "0" },
];

export const NAV_ITEMS: Array<{ id: View; label: string }> = [
  { id: "download", label: "Download" }, { id: "history", label: "History" }, { id: "settings", label: "Settings" },
];

export const EMPTY_TOOLS: Tools = { ytdlp: null, ffmpeg: null, deno: null };
