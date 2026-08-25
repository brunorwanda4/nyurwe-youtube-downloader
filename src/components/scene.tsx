"use client";

import { SylvaLivingWorldScene } from "@designcodeio/threeui/components/SylvaLivingWorldScene";
import "@designcodeio/threeui/style.css";

export function Scene() {
  return (
    <div className="shader-frame forest-scene" aria-hidden="true">
      <SylvaLivingWorldScene variant="living-green" />
    </div>
  );
}
