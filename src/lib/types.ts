export type Mode = "audio" | "video";
export type Status = "idle" | "running" | "success" | "error" | "cancelled";
export type View = "download" | "history" | "settings";
export type PreviewState = "ready" | "loading";
export type FormatId = "mp4-1080" | "mp4-720" | "mp3";
export type Tools = { ytdlp: string | null; ffmpeg: string | null; deno: string | null };
export type Format = { id: FormatId; title: string; detail: string; mode: Mode; quality: string };
export type Progress = {
  kind: "line" | "item" | "percent" | "done" | "cancelled" | "error";
  text: string; percent?: number; index?: number; total?: number;
};
