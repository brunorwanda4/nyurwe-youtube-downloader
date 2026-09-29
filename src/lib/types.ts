export type DownloadKind = "video" | "audio" | "playlist";
export type AudioFormat = "mp3" | "m4a" | "wav" | "opus";
export type AudioQuality = "best" | "320" | "256" | "192" | "128";
export type VideoQuality = "best" | "1080" | "720" | "480" | "360" | "240";
export type Status = "idle" | "running" | "paused" | "success" | "error" | "cancelled";
export type View = "home" | "downloads" | "playlists" | "settings";
export type Tools = { ytdlp: string | null; ffmpeg: string | null; deno: string | null };
export type Progress = {
  kind: "line" | "item" | "percent" | "done" | "cancelled" | "error";
  text: string;
  percent?: number;
  index?: number;
  total?: number;
};
export type MediaInfo = {
  title: string;
  channel: string;
  duration: number;
  thumbnail: string;
  isPlaylist: boolean;
  availableHeights: number[];
};

// Kept for the compact legacy history card while the main flow uses the richer selectors above.
export type Format = { title: string; detail: string; mode: "audio" | "video"; quality: string };
