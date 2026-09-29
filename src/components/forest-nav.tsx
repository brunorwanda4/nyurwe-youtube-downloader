"use client";

import { Download, Home, ListVideo, Settings, TreePine } from "lucide-react";
import { NAV_ITEMS } from "@/src/lib/constants";
import { View } from "@/src/lib/types";

const icons = { home: Home, downloads: Download, playlists: ListVideo, settings: Settings };

export function ForestNav({ activeView, onSelect }: { activeView: View; onSelect: (view: View) => void }) {
  return (
    <aside className="forest-sidebar">
      <button className="brand-lockup" type="button" onClick={() => onSelect("home")} aria-label="Forest Download home">
        <span className="brand-mark"><TreePine size={28} strokeWidth={1.7} /></span>
        <span><strong>Forest</strong><small>Download</small></span>
      </button>
      <ul className="menu menu-md sidebar-menu" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = icons[item.id];
          return <li key={item.id}><button className={activeView === item.id ? "menu-active" : ""} type="button" onClick={() => onSelect(item.id)}><Icon size={19} strokeWidth={1.8} /><span>{item.label}</span></button></li>;
        })}
      </ul>
      <div className="sidebar-status"><span className="status status-success" /><span><strong>Private & local</strong><small>Nothing is uploaded</small></span></div>
    </aside>
  );
}
