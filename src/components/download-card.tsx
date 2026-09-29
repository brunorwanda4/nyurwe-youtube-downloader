"use client";

import { CSSProperties, FormEvent } from "react";
import {
  CircleNotch, DownloadSimple, FolderOpen, Leaf, LinkSimple, ShieldCheck,
  Stop, WarningCircle, X, YoutubeLogo,
} from "@phosphor-icons/react";
import { Botanicals } from "./botanicals";
import { Format } from "@/src/lib/types";

type DownloadCardProps = {
  desktop: boolean;
  toolsChecked: boolean;
  missingTools: boolean;
  engineLabel: string;
  engineVersion: string;
  settingUp: boolean;
  setupText: string;
  onSetupTools: () => void;
  url: string;
  onUrlChange: (value: string) => void;
  folder: string;
  onPickFolder: () => void;
  error: string;
  running: boolean;
  canDownload: boolean;
  percent: number;
  progressLabel: string;
  format: Format;
  onStart: (event?: FormEvent) => void;
  onStop: () => void;
};

export function DownloadCard({
  desktop, toolsChecked, missingTools, engineLabel, engineVersion, settingUp, setupText, onSetupTools,
  url, onUrlChange, folder, onPickFolder, error, running, canDownload, percent, progressLabel,
  format, onStart, onStop,
}: DownloadCardProps) {
  return (
    <section className="card glass liquid-glass-card download-stone" aria-label="Download a YouTube video">
      <Botanicals className="card-botanicals top-growth" />
      <div className="card-symbol"><YoutubeLogo size={32} weight="fill" /></div>
      <div className={`badge badge-sm badge-outline engine-chip ${missingTools ? "warning" : ""}`}><span />{engineLabel}</div>

      {!desktop && (
        <p className="desktop-note">
          <ShieldCheck size={16} weight="fill" /> Browser preview only. The desktop app saves files locally.
        </p>
      )}

      {missingTools && (
        <div className="alert alert-soft setup-panel">
          <div><strong>One-time setup</strong><span>Install yt-dlp, FFmpeg, and Deno privately.</span></div>
          <button className="btn btn-sm" type="button" onClick={onSetupTools} disabled={settingUp}>{settingUp ? "Setting up…" : "Set up"}</button>
        </div>
      )}

      <form onSubmit={onStart}>
        <label className="sr-only" htmlFor="media-url">YouTube link</label>
        <div className="input input-lg river-input">
          <LinkSimple size={22} weight="bold" />
          <input
            id="media-url"
            type="url"
            inputMode="url"
            value={url}
            onChange={(event) => onUrlChange(event.target.value)}
            placeholder="Paste YouTube link"
            disabled={running}
            autoComplete="url"
          />
          {url && !running && (
            <button className="btn btn-ghost btn-circle btn-sm" type="button" onClick={() => onUrlChange("")} aria-label="Clear YouTube link"><X size={17} weight="bold" /></button>
          )}
        </div>

        <div className="download-utilities">
          <button
            className="btn btn-ghost btn-sm folder-control"
            type="button"
            onClick={onPickFolder}
            disabled={running || !desktop}
            title={folder || "Desktop downloads folder"}
          >
            <FolderOpen size={18} weight="fill" />
            <span>{folder ? folder.split(/[\/]/).pop() : desktop ? "Choose folder" : "Downloads folder"}</span>
          </button>
          {desktop && toolsChecked && !missingTools && (
            <button className="btn btn-ghost btn-sm engine-update" type="button" onClick={onSetupTools} disabled={settingUp || running}>
              {settingUp ? <CircleNotch className="spin" size={16} /> : <Leaf size={16} weight="fill" />}
              {settingUp ? setupText || "Updating…" : `Engine ${engineVersion || "installed"}`}
            </button>
          )}
        </div>

        {error && <div className="alert alert-error alert-soft forest-error" role="alert"><WarningCircle size={18} weight="fill" />{error}</div>}

        {running ? (
          <button className="btn btn-block moss-button running" type="button" onClick={onStop} style={{ "--download-progress": `${percent}%` } as CSSProperties}>
            <span className="button-progress" aria-hidden="true" />
            <span className="button-label"><Stop size={20} weight="fill" /> Stop • {progressLabel}</span>
          </button>
        ) : (
          <button className="btn btn-block moss-button" type="submit" disabled={!canDownload}>
            <span className="youtube-seed" aria-hidden="true" />
            Download {format.mode === "audio" ? "audio" : "video"}
            <DownloadSimple size={21} weight="bold" />
          </button>
        )}
      </form>

      <Botanicals className="card-botanicals bottom-growth" />
    </section>
  );
}
