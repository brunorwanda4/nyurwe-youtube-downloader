"use client";

import { Leaf } from "@phosphor-icons/react";

export function ForestHero() {
  return (
    <section className="forest-hero" aria-labelledby="page-title">
      <span className="hero-kicker"><Leaf size={16} weight="fill" /> Private by nature</span>
      <h1 id="page-title">Save your<br />videos.</h1>
      <p>Paste a YouTube link.<br />Choose a format.<br />Download.</p>
      <span className="hero-rule" />
      <small>Only save videos you own or have permission to download.</small>
    </section>
  );
}
