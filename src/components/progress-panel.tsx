"use client";

import { RefObject } from "react";
import { FolderOpen } from "@phosphor-icons/react";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { Status } from "@/src/lib/types";

type ProgressPanelProps = {
  status: Status;
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
  status, desktop, folder, current, statusHeading, progressLabel, percent, log, logRef,
}: ProgressPanelProps) {
  return (
    <section className={`technical-stone ${status}`} aria-live="polite">
      <div><strong>{current || statusHeading}</strong><span>{progressLabel}</span></div>
      <span className="thin-progress"><i style={{ width: `${percent}%` }} /></span>
      {status === "success" && desktop && (
        <button type="button" onClick={() => revealItemInDir(folder).catch(() => {})}>
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
