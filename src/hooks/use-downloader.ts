"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { AUDIO_FORMATS, AUDIO_QUALITIES, EMPTY_TOOLS, VIDEO_QUALITIES } from "@/src/lib/constants";
import { AudioFormat, AudioQuality, DownloadKind, MediaInfo, Progress, Status, Tools, VideoQuality, View } from "@/src/lib/types";
import { youtubeLink } from "@/src/lib/youtube";

const DEMO_MEDIA: MediaInfo = {
  title: "Morning Forest — A Calm Journey",
  channel: "Quiet Earth Studio",
  duration: 1484,
  thumbnail: "/assets/forest-walk-thumbnail.png",
  isPlaylist: false,
  availableHeights: [1080, 720, 480, 360, 240],
};

export function useDownloader() {
  const [initializing, setInitializing] = useState(true);
  const [desktop, setDesktop] = useState(false);
  const [activeView, setActiveView] = useState<View>("home");
  const [url, setUrlState] = useState("");
  const [media, setMedia] = useState<MediaInfo | null>(null);
  const [inspecting, setInspecting] = useState(false);
  const [kind, setKind] = useState<DownloadKind>("video");
  const [videoQuality, setVideoQuality] = useState<VideoQuality>("best");
  const [audioFormat, setAudioFormat] = useState<AudioFormat>("mp3");
  const [audioQuality, setAudioQuality] = useState<AudioQuality>("best");
  const [folder, setFolder] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [percent, setPercent] = useState(0);
  const [current, setCurrent] = useState("");
  const [counter, setCounter] = useState<{ index: number; total: number } | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [tools, setTools] = useState<Tools | null>(null);
  const [settingUp, setSettingUp] = useState(false);
  const [setupText, setSetupText] = useState("");
  const [error, setError] = useState("");
  const logRef = useRef<HTMLDivElement>(null);
  const demoTimer = useRef<number | null>(null);
  const inspectSequence = useRef(0);
  const running = status === "running" || status === "paused";

  useEffect(() => {
    const inDesktop = isTauri();
    setDesktop(inDesktop);
    let active = true;
    const minimumScene = new Promise<void>((resolve) => window.setTimeout(resolve, 500));
    if (!inDesktop) {
      setFolder("Downloads / Forest");
      setUrlState("https://youtu.be/forest-preview");
      minimumScene.then(() => active && setInitializing(false));
      return () => { active = false; };
    }
    Promise.all([
      invoke<string>("default_folder").catch(() => ""),
      invoke<Tools>("check_tools").catch(() => EMPTY_TOOLS),
      minimumScene,
    ]).then(([defaultFolder, installedTools]) => {
      if (!active) return;
      setFolder(defaultFolder);
      setTools(installedTools);
      setInitializing(false);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!desktop) return;
    const progressStop = listen<Progress>("progress", ({ payload }) => {
      if (payload.kind === "percent") {
        setPercent(payload.percent ?? 0);
        if (payload.text) setCurrent(payload.text);
        return;
      }
      if (payload.kind === "item") {
        setCounter({ index: payload.index ?? 0, total: payload.total ?? 0 });
        setPercent(0);
        return;
      }
      if (payload.kind === "done") { setStatus("success"); setPercent(100); }
      else if (payload.kind === "cancelled") setStatus("cancelled");
      else if (payload.kind === "error") { setStatus("error"); setError(payload.text); }
      setLog((previous) => [...previous.slice(-250), payload.text]);
    });
    const setupStop = listen<{ text: string }>("setup-progress", ({ payload }) => setSetupText(payload.text));
    return () => {
      progressStop.then((stopListening) => stopListening());
      setupStop.then((stopListening) => stopListening());
    };
  }, [desktop]);

  useEffect(() => {
    if (!youtubeLink(url)) {
      setMedia(null);
      setInspecting(false);
      return;
    }
    const sequence = ++inspectSequence.current;
    setInspecting(true);
    setError("");
    const timer = window.setTimeout(async () => {
      try {
        const result = desktop ? await invoke<MediaInfo>("inspect_url", { url }) : DEMO_MEDIA;
        if (sequence === inspectSequence.current) {
          setMedia(result);
          setKind(result.isPlaylist ? "playlist" : "video");
        }
      } catch (reason) {
        if (sequence === inspectSequence.current) {
          setMedia(null);
          setError(String(reason));
        }
      } finally {
        if (sequence === inspectSequence.current) setInspecting(false);
      }
    }, desktop ? 350 : 520);
    return () => window.clearTimeout(timer);
  }, [url, desktop]);

  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" }); }, [log]);
  useEffect(() => () => { if (demoTimer.current) window.clearInterval(demoTimer.current); }, []);

  const selectedOption = useMemo(() => {
    if (kind === "audio") {
      const format = AUDIO_FORMATS.find((item) => item.id === audioFormat)!;
      const quality = AUDIO_QUALITIES.find((item) => item.id === audioQuality)!;
      return { label: `${format.title} · ${quality.label}`, size: audioFormat === "wav" ? "~122 MB" : "~18 MB" };
    }
    if (kind === "playlist") return { label: "Best available · MP4", size: "Calculated at start" };
    const quality = VIDEO_QUALITIES.find((item) => item.id === videoQuality)!;
    return { label: quality.label, size: quality.size };
  }, [kind, videoQuality, audioFormat, audioQuality]);

  function setUrl(value: string) {
    setUrlState(value.trimStart());
    if (!value) {
      setMedia(null);
      setError("");
      setStatus("idle");
    }
  }

  async function pasteUrl() {
    try {
      const value = await navigator.clipboard.readText();
      setUrl(value);
      if (!youtubeLink(value.trim())) setError("That clipboard item is not a YouTube link.");
    } catch {
      setError("Clipboard access was blocked. Paste the link into the field instead.");
    }
  }

  async function pickFolder() {
    if (!desktop) return;
    const picked = await open({ directory: true, defaultPath: folder || undefined });
    if (typeof picked === "string") setFolder(picked);
  }

  async function setupTools() {
    setSettingUp(true);
    setSetupText("Preparing the download engine…");
    setError("");
    try {
      const installed = await invoke<Tools>("setup_tools");
      setTools(installed);
      setSetupText("Download engine is ready.");
    } catch (reason) { setError(String(reason)); setSetupText(""); }
    finally { setSettingUp(false); }
  }

  function runBrowserPreview() {
    let nextPercent = 4;
    demoTimer.current = window.setInterval(() => {
      nextPercent = Math.min(nextPercent + Math.round(Math.random() * 8 + 3), 100);
      setPercent(nextPercent);
      setCurrent(nextPercent < 35 ? "Preparing media streams" : nextPercent < 82 ? "Saving to your Forest folder" : "Finishing download");
      if (nextPercent >= 100 && demoTimer.current) {
        window.clearInterval(demoTimer.current);
        demoTimer.current = null;
        setStatus("success");
      }
    }, 620);
  }

  async function start(event?: FormEvent) {
    event?.preventDefault();
    setError("");
    if (!url.trim() || !youtubeLink(url.trim())) { setError("Paste a valid YouTube link to begin."); return; }
    if (!media) { setError("Wait for the video details to finish loading."); return; }
    if (desktop && !folder) { setError("Choose where you want to save the file."); return; }
    setStatus("running");
    setPercent(3);
    setCounter(null);
    setCurrent("Preparing media streams");
    setLog([]);
    if (!desktop) { runBrowserPreview(); return; }
    const mode = kind === "audio" ? "audio" : "video";
    const quality = kind === "audio" ? audioQuality : kind === "playlist" ? "best" : videoQuality;
    try {
      await invoke("start_download", { url: url.trim(), mode, quality, audioFormat, folder });
    } catch (reason) { setError(String(reason)); setStatus("error"); }
  }

  function togglePause() {
    if (desktop) return;
    if (status === "paused") {
      setStatus("running");
      runBrowserPreview();
    } else if (status === "running") {
      if (demoTimer.current) window.clearInterval(demoTimer.current);
      demoTimer.current = null;
      setStatus("paused");
    }
  }

  async function stop() {
    if (demoTimer.current) { window.clearInterval(demoTimer.current); demoTimer.current = null; }
    if (desktop) await invoke("cancel_download").catch(() => {});
    setStatus("cancelled");
  }

  const missingTools = desktop && tools !== null && (!tools.ytdlp || !tools.ffmpeg || !tools.deno);
  const canDownload = !running && !settingUp && !!media && (!desktop || (tools !== null && !missingTools && folder !== ""));
  const progressLabel = counter ? `${counter.index} of ${counter.total}` : `${Math.round(percent)}%`;

  return {
    initializing, desktop, activeView, setActiveView, url, setUrl, pasteUrl, media, inspecting,
    kind, setKind, videoQuality, setVideoQuality, audioFormat, setAudioFormat, audioQuality, setAudioQuality,
    folder, pickFolder, status, percent, current, log, logRef, tools, missingTools, settingUp, setupText,
    error, running, canDownload, progressLabel, selectedOption, setupTools, start, stop, togglePause,
  };
}
