"use client";

import { ShieldCheck } from "@phosphor-icons/react";

export function ForestFooter() {
  return (
    <footer className="forest-footer">
      <span><ShieldCheck size={15} weight="fill" /> Downloads stay on your computer</span>
      <span>Powered by yt-dlp</span>
    </footer>
  );
}
