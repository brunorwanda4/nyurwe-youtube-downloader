import { AudioFormat, AudioQuality, DownloadKind, Tools, VideoQuality, View } from "./types";

export const NAV_ITEMS: Array<{ id: View; label: string }> = [
  { id: "home", label: "Home" },
  { id: "downloads", label: "Downloads" },
  { id: "playlists", label: "Playlists" },
  { id: "settings", label: "Settings" },
];

export const DOWNLOAD_TYPES: Array<{ id: DownloadKind; title: string; description: string }> = [
  { id: "video", title: "Video", description: "Download video with sound" },
  { id: "audio", title: "Audio", description: "Extract only audio or music" },
  { id: "playlist", title: "Playlist", description: "Save every video in the list" },
];

export const VIDEO_QUALITIES: Array<{ id: VideoQuality; label: string; detail: string; size: string }> = [
  { id: "best", label: "Best available", detail: "MP4 · Auto", size: "Best fit" },
  { id: "1080", label: "1080p Full HD", detail: "MP4 · H.264", size: "~432 MB" },
  { id: "720", label: "720p HD", detail: "MP4 · H.264", size: "~248 MB" },
  { id: "480", label: "480p", detail: "MP4 · H.264", size: "~126 MB" },
  { id: "360", label: "360p", detail: "MP4 · H.264", size: "~84 MB" },
  { id: "240", label: "240p", detail: "MP4 · H.264", size: "~52 MB" },
];

export const AUDIO_FORMATS: Array<{ id: AudioFormat; title: string; description: string }> = [
  { id: "mp3", title: "MP3", description: "Best for music" },
  { id: "m4a", title: "M4A", description: "High quality, small size" },
  { id: "wav", title: "WAV", description: "Highest quality, large file" },
  { id: "opus", title: "OPUS", description: "Efficient, high quality" },
];

export const AUDIO_QUALITIES: Array<{ id: AudioQuality; label: string }> = [
  { id: "best", label: "Best quality" },
  { id: "320", label: "320 kbps" },
  { id: "256", label: "256 kbps" },
  { id: "192", label: "192 kbps" },
  { id: "128", label: "128 kbps" },
];

export const EMPTY_TOOLS: Tools = { ytdlp: null, ffmpeg: null, deno: null };
