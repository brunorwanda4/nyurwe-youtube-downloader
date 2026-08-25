"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { StartupScreen } from "@/src/components/startup-screen";

type Mode = "audio" | "video";
type Status = "idle" | "running" | "success" | "error" | "cancelled";

type Tools = {
  ytdlp: string | null;
  ffmpeg: string | null;
  deno: string | null;
};

type Progress = {
  kind: "line" | "item" | "percent" | "done" | "cancelled" | "error";
  text: string;
  percent?: number;
  index?: number;
  total?: number;
};

const AUDIO_QUALITY = [
  { value: "0", label: "Best", detail: "Up to 320 kbps" },
  { value: "5", label: "Balanced", detail: "Around 128 kbps" },
  { value: "9", label: "Compact", detail: "Around 64 kbps" },
];

const VIDEO_QUALITY = [
  { value: "2160", label: "4K", detail: "Up to 2160p" },
  { value: "1080", label: "Full HD", detail: "Up to 1080p" },
  { value: "720", label: "HD", detail: "Up to 720p" },
  { value: "480", label: "Data saver", detail: "Up to 480p" },
];

function Icon({ name }: { name: "arrow" | "audio" | "check" | "folder" | "link" | "video" }) {
  const paths = {
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    audio: <><path d="M9 18V5l10-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="16" cy="16" r="3" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    folder: <path d="M3 7h6l2 2h10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm0 0V5a2 2 0 0 1 2-2h4l2 2h4" />,
    link: <><path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" /><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1" /></>,
    video: <><rect x="3" y="5" width="14" height="14" rx="2" /><path d="m17 10 4-2v8l-4-2" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export default function Home() {
  const [initializing, setInitializing] = useState(true);
  const [desktop, setDesktop] = useState(false);
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState<Mode>("video");
  const [quality, setQuality] = useState("1080");
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
  const running = status === "running";

  useEffect(() => {
    const inDesktop = isTauri();
    setDesktop(inDesktop);
    let active = true;
    const minimumSceneTime = new Promise<void>((resolve) => window.setTimeout(resolve, 1500));

    if (!inDesktop) {
      minimumSceneTime.then(() => {
        if (active) setInitializing(false);
      });
      return () => {
        active = false;
      };
    }

    Promise.all([
      invoke<string>("default_folder").catch(() => ""),
      invoke<Tools>("check_tools").catch(() => ({ ytdlp: null, ffmpeg: null, deno: null })),
      minimumSceneTime,
    ]).then(([defaultFolder, installedTools]) => {
      if (!active) return;
      setFolder(defaultFolder);
      setTools(installedTools);
      setInitializing(false);
    });

    return () => {
      active = false;
    };
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
      if (payload.kind === "done") {
        setStatus("success");
        setPercent(100);
      } else if (payload.kind === "cancelled") {
        setStatus("cancelled");
      } else if (payload.kind === "error") {
        setStatus("error");
        setError(payload.text);
      }
      setLog((previous) => [...previous.slice(-250), payload.text]);
    });
    const setupStop = listen<{ text: string }>("setup-progress", ({ payload }) => {
      setSetupText(payload.text);
    });
    return () => {
      progressStop.then((stop) => stop());
      setupStop.then((stop) => stop());
    };
  }, [desktop]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [log]);

  function switchMode(next: Mode) {
    setMode(next);
    setQuality(next === "audio" ? "0" : "1080");
  }

  async function pickFolder() {
    const picked = await open({ directory: true, defaultPath: folder || undefined });
    if (typeof picked === "string") setFolder(picked);
  }

  async function setupTools() {
    setSettingUp(true);
    setSetupText("Checking for engine updates…");
    setError("");
    try {
      const installed = await invoke<Tools>("setup_tools");
      setTools(installed);
      setSetupText("Download engine is ready.");
    } catch (reason) {
      setError(String(reason));
      setSetupText("");
    } finally {
      setSettingUp(false);
    }
  }

  function validLink(value: string) {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  async function start(event?: FormEvent) {
    event?.preventDefault();
    setError("");
    if (!validLink(url.trim())) {
      setError("Paste a valid video or playlist link.");
      return;
    }
    if (!folder) {
      setError("Choose where you want to save the file.");
      return;
    }
    setStatus("running");
    setPercent(0);
    setCounter(null);
    setCurrent("Reading the link…");
    setLog([]);
    try {
      await invoke("start_download", { url: url.trim(), mode, quality, folder });
    } catch (reason) {
      setError(String(reason));
      setStatus("error");
    }
  }

  async function stop() {
    await invoke("cancel_download").catch(() => {});
  }

  const missingTools = tools !== null && (!tools.ytdlp || !tools.ffmpeg || !tools.deno);
  const engineLabel = settingUp ? "Setting up" : tools === null ? "Checking" : missingTools ? "Setup needed" : "Ready";
  const engineVersion = tools?.ytdlp?.match(/\d{4}\.\d{2}\.\d{2}(?:\.\d+)?/)?.[0] ?? "";
  const qualityOptions = mode === "audio" ? AUDIO_QUALITY : VIDEO_QUALITY;
  const canDownload = desktop && tools !== null && !running && !settingUp && !missingTools && url.trim() !== "" && folder !== "";

  if (initializing) return <StartupScreen />;

  return (
    <main className="app-shell">
      <nav className="topbar" aria-label="Main navigation">
        <a className="brand" href="#top" aria-label="YtGrab home">
          <span className="brand-mark"><span /></span>
          <span>YtGrab</span>
        </a>
        <div className="nav-meta">
          <span className="privacy-dot" />
          Private. On your device.
        </div>
      </nav>

      <div id="top" className="hero-grid">
        <section className="intro" aria-labelledby="page-title">
          <div className="eyebrow">Your media, ready when you are</div>
          <h1 id="page-title">Keep the videos<br />worth keeping.</h1>
          <p className="lead">
            Save videos, playlists, or audio in the quality you choose. No ads, no account, and no files sent to a middleman.
          </p>
          <div className="trust-row" aria-label="Product benefits">
            <span><Icon name="check" /> Video &amp; audio</span>
            <span><Icon name="check" /> Playlists</span>
            <span><Icon name="check" /> Original metadata</span>
          </div>
          <p className="legal-note">Only download media you own or have permission to save.</p>
        </section>

        <section className="download-card" aria-label="Download controls">
          <div className="card-head">
            <div>
              <span className="step-label">STEP 01</span>
              <h2>Add a link</h2>
            </div>
            <span className={`ready-pill ${missingTools ? "needs-setup" : ""}`}><span /> {engineLabel}</span>
          </div>

          {!desktop && (
            <div className="notice">This downloader runs in the YtGrab desktop app. Open the installed app to save media.</div>
          )}

          {missingTools && (
            <div className="setup-panel">
              <div>
                <strong>One-time engine setup</strong>
                <p>YtGrab needs its private download tools before the first use.</p>
              </div>
              <button className="secondary-button" type="button" onClick={setupTools} disabled={settingUp}>
                {settingUp ? "Setting up…" : "Set up now"}
              </button>
              {setupText && <div className="setup-status"><span className={settingUp ? "spinner" : "mini-check"} />{setupText}</div>}
            </div>
          )}

          <form onSubmit={start}>
            <label className="field-label" htmlFor="media-url">Video or playlist link</label>
            <div className="input-wrap">
              <Icon name="link" />
              <input
                id="media-url"
                type="url"
                inputMode="url"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="Paste a link from YouTube or another site"
                disabled={running}
                autoComplete="url"
              />
              {url && <button className="clear-button" type="button" onClick={() => setUrl("")} aria-label="Clear link">×</button>}
            </div>

            <div className="format-section-label"><span>STEP 02</span> Choose your format</div>
            <div className="format-tabs" role="tablist" aria-label="Download format">
              <button type="button" role="tab" aria-selected={mode === "video"} className={mode === "video" ? "active" : ""} onClick={() => switchMode("video")} disabled={running}>
                <Icon name="video" /><span><strong>Video</strong><small>MP4 with audio</small></span>
              </button>
              <button type="button" role="tab" aria-selected={mode === "audio"} className={mode === "audio" ? "active" : ""} onClick={() => switchMode("audio")} disabled={running}>
                <Icon name="audio" /><span><strong>Audio</strong><small>MP3 with cover art</small></span>
              </button>
            </div>

            <div className="form-row">
              <label>
                <span className="field-label">Quality</span>
                <select value={quality} onChange={(event) => setQuality(event.target.value)} disabled={running}>
                  {qualityOptions.map((option) => <option key={option.value} value={option.value}>{option.label} · {option.detail}</option>)}
                </select>
              </label>
              <label>
                <span className="field-label">Save location</span>
                <button className="folder-button" type="button" onClick={pickFolder} disabled={running || !desktop} title={folder}>
                  <Icon name="folder" /><span>{folder ? folder.split(/[\\/]/).pop() : "Choose folder"}</span><b>Browse</b>
                </button>
              </label>
            </div>

            {error && <div className="error-message" role="alert">{error}</div>}

            {running ? (
              <button className="download-button stop" type="button" onClick={stop}>Stop download</button>
            ) : (
              <button className="download-button" type="submit" disabled={!canDownload}>
                Download {mode === "audio" ? "audio" : "video"}<Icon name="arrow" />
              </button>
            )}

            {tools !== null && !missingTools && (
              <div className="engine-row">
                <span>Download engine {engineVersion || "installed"}</span>
                <button type="button" onClick={setupTools} disabled={settingUp || running}>
                  {settingUp ? "Updating…" : "Update engine"}
                </button>
              </div>
            )}
            {settingUp && setupText && !missingTools && (
              <div className="inline-setup-status"><span className="spinner" />{setupText}</div>
            )}
          </form>

          {(status !== "idle" || log.length > 0) && (
            <div className={`progress-panel ${status}`} aria-live="polite">
              <div className="progress-copy">
                <strong>{status === "success" ? "Download complete" : status === "cancelled" ? "Download stopped" : status === "error" ? "Something went wrong" : current || "Preparing…"}</strong>
                <span>{counter ? `${counter.index} of ${counter.total}` : `${Math.round(percent)}%`}</span>
              </div>
              <div className="progress-track"><span style={{ width: `${percent}%` }} /></div>
              {status === "success" && <button className="reveal-button" type="button" onClick={() => revealItemInDir(folder).catch(() => {})}>Show in folder <Icon name="arrow" /></button>}
              {log.length > 0 && <details><summary>Technical details</summary><div ref={logRef} className="log">{log.map((line, index) => <p key={`${index}-${line}`}>{line}</p>)}</div></details>}
            </div>
          )}
        </section>
      </div>

      <footer>
        <span>Powered by yt-dlp</span>
        <span>Downloads stay on your computer</span>
      </footer>
    </main>
  );
}
