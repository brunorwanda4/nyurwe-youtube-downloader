"use client";

import Image from "next/image";
import { CheckCircle2, MoreHorizontal } from "lucide-react";

const RECENTS = [{ title: "Lake in the Mountains", meta: "Video · 1080p · 412 MB", position: "50% 54%" }, { title: "Forest Ambience", meta: "Audio · MP3 · 18 MB", position: "28% 58%" }, { title: "Peaceful Nature Moments", meta: "Video · 720p · 293 MB", position: "73% 46%" }, { title: "Gentle Rain Sounds", meta: "Audio · OPUS · 44 MB", position: "42% 72%" }];

export function RecentDownloadCard({ title, meta, position }: { title: string; meta: string; position: string }) {
  return <article className="card recent-card"><figure><Image src="/assets/forest-mountain-dawn.png" width={320} height={138} alt="" style={{ objectPosition: position }} /></figure><div className="recent-copy"><span><strong>{title}</strong><small>{meta}</small></span><button className="btn btn-circle btn-ghost btn-xs" type="button" aria-label={`More options for ${title}`}><MoreHorizontal size={17} /></button></div><CheckCircle2 className="recent-check" size={17} /></article>;
}

export function RecentDownloads() {
  return <section className="glass-panel recent-section"><div className="recent-heading"><div><span className="eyebrow">Saved locally</span><h2>Recent downloads</h2></div><button className="btn btn-ghost btn-sm" type="button">View all</button></div><div className="recent-grid">{RECENTS.map((item) => <RecentDownloadCard key={item.title} {...item} />)}</div></section>;
}
