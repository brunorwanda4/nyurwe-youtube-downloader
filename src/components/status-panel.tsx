"use client";

import { CheckCircle, CircleNotch, DownloadSimple, WarningCircle } from "@phosphor-icons/react";
import { Botanicals } from "./botanicals";
import { Status } from "@/src/lib/types";

type StatusPanelProps = {
  status: Status;
  running: boolean;
  statusHeading: string;
  progressLabel: string;
  current: string;
  percent: number;
};

export function StatusPanel({ status, running, statusHeading, progressLabel, current, percent }: StatusPanelProps) {
  return (
    <aside className={`stone-card status-stone ${status}`} aria-live="polite">
      <Botanicals className="status-growth" />
      <span className="status-eyebrow">Nyurwe desktop</span>
      <h2>{statusHeading}</h2>
      <div className="download-orb">
        {status === "success" ? <CheckCircle size={56} weight="fill" />
          : status === "error" ? <WarningCircle size={56} weight="fill" />
          : running ? <CircleNotch className="spin" size={56} />
          : <DownloadSimple size={56} weight="bold" />}
      </div>
      <strong>{running ? progressLabel : "487.6 MB"}</strong>
      <p>{running ? current || "Gathering streams…" : status === "success" ? "Saved safely on your device." : "MP4 1080p • Video + audio"}</p>
      <span className="status-progress"><i style={{ width: `${percent}%` }} /></span>
    </aside>
  );
}
