"use client";

import Image from "next/image";
import { CirclePause, CirclePlay, FolderOpen, X } from "lucide-react";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { DownloadKind, MediaInfo, Status } from "@/src/lib/types";

export type QueueItemProps = { media: MediaInfo; kind: DownloadKind; detail: string; percent: number; status: Status; current: string; desktop: boolean; folder: string; onPause: () => void; onCancel: () => void };

export function QueueItem({ media, kind, detail, percent, status, current, desktop, folder, onPause, onCancel }: QueueItemProps) {
  const active = status === "running" || status === "paused";
  const label = status === "success" ? "Ready in your folder" : status === "paused" ? "Paused" : current || "Waiting to start";
  return <article className="queue-item"><Image src={media.thumbnail || "/assets/forest-walk-thumbnail.png"} width={76} height={76} alt="" unoptimized className="queue-thumb" /><div className="queue-copy"><strong>{media.title}</strong><span>{kind === "audio" ? "Audio" : kind === "playlist" ? "Playlist" : "Video"} · {detail}</span><progress className="progress progress-primary queue-progress" value={percent} max="100" /><small>{Math.round(percent)}% · {label}</small></div><div className="queue-actions">{active && <button className="btn btn-circle btn-ghost btn-sm" type="button" onClick={onPause} aria-label={status === "paused" ? "Resume" : "Pause"} disabled={desktop}>{status === "paused" ? <CirclePlay size={20} /> : <CirclePause size={20} />}</button>}{active && <button className="btn btn-circle btn-ghost btn-sm queue-cancel" type="button" onClick={onCancel} aria-label="Cancel download"><X size={18} /></button>}{status === "success" && <button className="btn btn-circle btn-ghost btn-sm" type="button" onClick={() => desktop && revealItemInDir(folder).catch(() => {})} aria-label="Open folder"><FolderOpen size={19} /></button>}</div></article>;
}

export function QueuePanel(props: QueueItemProps & { setupNeeded: boolean; onSetup: () => void; settingUp: boolean }) {
  const showItem = props.status !== "idle" && props.status !== "cancelled";
  return <aside className="glass-panel queue-panel"><div className="panel-heading"><div><span className="eyebrow">In progress</span><h2>Download queue</h2></div><span className="badge badge-soft">{showItem ? "1 active" : "Quiet"}</span></div>{props.setupNeeded && <div className="engine-callout"><span><strong>One-time setup</strong><small>Install the private download engine.</small></span><button className="btn btn-sm" type="button" onClick={props.onSetup} disabled={props.settingUp}>{props.settingUp ? "Preparing…" : "Set up"}</button></div>}{showItem ? <QueueItem {...props} /> : <div className="queue-empty"><span className="empty-rings"><CirclePlay size={22} /></span><strong>Your queue is peaceful</strong><small>New downloads will appear here.</small></div>}<div className="queue-foot"><span><i />Secure local processing</span><small>No cloud uploads</small></div></aside>;
}
