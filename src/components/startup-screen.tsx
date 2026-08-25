"use client";

import { YoutubeLogo } from "@phosphor-icons/react";
import { Scene } from "./scene";

export function StartupScreen() {
  return (
    <div className="startup-screen">
      <Scene />
      <div className="forest-backdrop" aria-hidden="true" />
      <div className="startup-content">
        <span className="startup-mark"><YoutubeLogo size={29} weight="fill" /></span>
        <strong className="startup-wordmark">Nyurwe</strong>
        <p>Waking the forest</p>
        <span className="startup-progress" aria-label="Loading"><span /></span>
      </div>
      <span className="startup-footnote">PRIVATE • LOCAL • YOURS</span>
    </div>
  );
}
