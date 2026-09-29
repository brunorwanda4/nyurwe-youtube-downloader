"use client";

import { RefObject } from "react";
import { CheckCircle, CircleNotch, DownloadSimple, FolderOpen, WarningCircle } from "@phosphor-icons/react";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { Botanicals } from "./botanicals";
import { Status } from "@/src/lib/types";

type ProgressPanelProps = {
  status: Status;
  running: boolean;
  desktop: boolean;
  folder: string;
  current: string;
  statusHeading: string;
  progressLabel: string;
  percent: number;
  log: string[];
  logRef: RefObject<HTMLDivElement | null>;
};

export function ProgressPanel({
  status, running, desktop, folder, current, statusHeading, progressLabel, percent, log, logRef,
}: ProgressPanelProps) {
  return (
    <section className={`card glass technical-stone progress-panel ${status}`} aria-live="polite">
      <Botanicals className="status-growth" />
      <div className="progress-summary">
        <div className="download-orb">
          {status === "success" ? <CheckCircle size={38} weight="fill" />
            : status === "error" ? <WarningCircle size={38} weight="fill" />
            : running ? <CircleNotch className="spin" size={38} />
            : <DownloadSimple size={38} weight="bold" />}
        </div>
        <div className="progress-copy">
          <span className="status-eyebrow">Nyurwe desktop</span>
          <h2>{statusHeading}</h2>
          <strong>{running ? progressLabel : status === "success" ? "Download complete" : progressLabel}</strong>
          <p>{running ? current || "Gathering streams…" : status === "success" ? "Saved safely on your device." : current || "Waiting for download details."}</p>
        </div>
      </div>
      <span className="status-progress" aria-label={`${percent}% complete`}><i style={{ width: `${percent}%` }} /></span>
      {status === "success" && desktop && (
        <button className="btn btn-ghost btn-sm" type="button" onClick={() => revealItemInDir(folder).catch(() => {})}>
          <FolderOpen size={17} weight="fill" />Show in folder
        </button>
      )}
      {log.length > 0 && (
        <details>
          <summary>Technical details</summary>
          <div ref={logRef} className="forest-log">
            {log.map((line, index) => <p key={`${index}-${line}`}>{line}</p>)}
          </div>
        </details>
      )}
    </section>
  );
}
