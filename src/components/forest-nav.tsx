"use client";

import { YoutubeLogo } from "@phosphor-icons/react";
import { Botanicals } from "./botanicals";
import { NAV_ITEMS } from "@/src/lib/constants";
import { View } from "@/src/lib/types";

type ForestNavProps = {
  activeView: View;
  onSelect: (view: View) => void;
};

export function ForestNav({ activeView, onSelect }: ForestNavProps) {
  return (
    <nav className="bark-nav" aria-label="Main navigation">
      <YoutubeLogo className="nav-youtube" size={26} weight="fill" aria-hidden="true" />
      <div className="nav-items">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={activeView === item.id ? "active" : ""}
            aria-current={activeView === item.id ? "page" : undefined}
            onClick={() => onSelect(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <Botanicals className="nav-botanicals" />
    </nav>
  );
}
