"use client";

import { WarpFieldBackground } from "@designcodeio/threeui/components/WarpFieldBackground";
import "@designcodeio/threeui/style.css";

export function Scene() {
  return (
    <div className="shader-frame" aria-hidden="true">
      <WarpFieldBackground
        variant="letters"
        speed={15.0}
        streakOpacity={0.6}
        tileOpacity={0.9}
        fov={75}
        hue={0}
        saturation={1.0}
        brightness={1.0}
      />
    </div>
  );
}
