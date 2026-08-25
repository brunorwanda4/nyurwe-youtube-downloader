"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { EMPTY_TOOLS, FORMATS } from "@/src/lib/constants";
import { FormatId, PreviewState, Progress, Status, Tools, View } from "@/src/lib/types";
import { youtubeLink } from "@/src/lib/youtube";

const MINIMUM_SCENE_MS = 1200;

export function useDownloader() {
  const [initializing, setInitializing] = useState(true);
  const [desktop, setDesktop] = useState(false);
  const [activeView, setActiveView] = useState<View>("download");
  const [url, setUrl] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<FormatId>("mp4-1080");
  const [folder, setFolder] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [previewState, setPreviewState] = useState<PreviewState>("ready");
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
  const running = status === "running";
  const format = FORMATS.find((item) => item.id === selectedFormat) ?? FORMATS[0];

  useEffect(() => {
    const inDesktop = isTauri();
    setDesktop(inDesktop);
    let active = true;
    const minimumSceneTime = new Promise<void>((resolve) => window.setTimeout(resolve, MINIMUM_SCENE_MS));
    if (!inDesktop) {
      minimumSceneTime.then(() => active && setInitializing(false));
      return () => { active = false; };
    }
    Promise.all([
      invoke<string>("default_folder").catch(() => ""),
      invoke<Tools>("check_tools").catch(() => EMPTY_TOOLS),
      minimumSceneTime,
    ]).then(([defaultFolder, installedTools]) => {
      if (!active) return;
      setFolder(defaultFolder); setTools(installedTools); setInitializing(false);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!desktop) return;
    const progressStop = listen<Progress>("progress", ({ payload }) => {
      if (payload.kind === "percent") {
        setPercent(payload.percent ?? 0); setPreviewState("ready");
        if (payload.text) setCurrent(payload.text);
        return;
      }
      if (payload.kind === "item") {
        setCounter({ index: payload.index ?? 0, total: payload.total ?? 0 }); setPercent(0); return;
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

  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" }); }, [log]);
  useEffect(() => () => { if (demoTimer.current) window.clearInterval(demoTimer.current); }, []);

  async function pickFolder() {
    if (!desktop) return;
    const picked = await open({ directory: true, defaultPath: folder || undefined });
    if (typeof picked === "string") setFolder(picked);
  }

  async function setupTools() {
    setSettingUp(true); setSetupText("Checking the forest engine…"); setError("");
    try {
      const installed = await invoke<Tools>("setup_tools");
      setTools(installed); setSetupText("Download engine is ready.");
    } catch (reason) { setError(String(reason)); setSetupText(""); }
    finally { setSettingUp(false); }
  }

  function runBrowserPreview() {
    let nextPercent = 8;
    demoTimer.current = window.setInterval(() => {
      nextPercent = Math.min(nextPercent + Math.round(Math.random() * 12 + 6), 100);
      setPercent(nextPercent);
      setCurrent(nextPercent < 38 ? "Reading video details…" : nextPercent < 84 ? "Gathering media streams…" : "Finishing preview…");
      if (nextPercent >= 100 && demoTimer.current) {
        window.clearInterval(demoTimer.current); demoTimer.current = null; setStatus("success");
      }
    }, 430);
  }

  async function start(event?: FormEvent) {
    event?.preventDefault(); setError("");
    if (!url.trim()) { setError("Paste a YouTube link to begin."); return; }
    if (!youtubeLink(url.trim())) { setError("Use a valid YouTube or youtu.be link."); return; }
    if (desktop && !folder) { setError("Choose where you want to save the file."); return; }
    setStatus("running"); setPreviewState("loading"); setPercent(3); setCounter(null);
    setCurrent("Reading the YouTube link…"); setLog([]);
    await new Promise((resolve) => window.setTimeout(resolve, 650));
    setPreviewState("ready");
    if (!desktop) { runBrowserPreview(); return; }
    try {
      await invoke("start_download", { url: url.trim(), mode: format.mode, quality: format.quality, folder });
    } catch (reason) { setError(String(reason)); setStatus("error"); }
  }

  async function stop() {
    if (demoTimer.current) { window.clearInterval(demoTimer.current); demoTimer.current = null; }
    if (desktop) await invoke("cancel_download").catch(() => {}); else setStatus("cancelled");
  }

  const missingTools = desktop && tools !== null && (!tools.ytdlp || !tools.ffmpeg || !tools.deno);
  const engineVersion = tools?.ytdlp?.match(/\d{4}\.\d{2}\.\d{2}(?:\.\d+)?/)?.[0] ?? "";
  const engineLabel = !desktop ? "Preview mode" : settingUp ? "Growing tools" : tools === null ? "Checking" : missingTools ? "Setup needed" : "Engine ready";
  const canDownload = !running && !settingUp && url.trim() !== "" && (!desktop || (tools !== null && !missingTools && folder !== ""));
  const progressLabel = counter ? `${counter.index} of ${counter.total}` : `${Math.round(percent)}%`;
  const statusHeading = status === "running" ? "Downloading" : status === "success" ? "Download complete" : status === "error" ? "Needs attention" : status === "cancelled" ? "Download stopped" : "Ready to download";

  return {
    initializing, desktop, activeView, setActiveView,
    url, setUrl, selectedFormat, setSelectedFormat, folder,
    status, previewState, percent, current, log, logRef,
    tools, settingUp, setupText, error,
    running, format, missingTools, engineVersion, engineLabel,
    canDownload, progressLabel, statusHeading,
    pickFolder, setupTools, start, stop,
  };
}
