"use client";

import Image from "next/image";
import { CheckCircle, ClockCounterClockwise } from "@phosphor-icons/react";
import { Botanicals } from "./botanicals";
import { Format, Status } from "@/src/lib/types";

type HistoryViewProps = {
  status: Status;
  format: Format;
  onReturn: () => void;
};

export function HistoryView({ status, format, onReturn }: HistoryViewProps) {
  return (
    <section className="stone-card utility-view">
      <ClockCounterClockwise size={38} weight="duotone" />
      <span className="hero-kicker">Private history</span>
      <h1>Your downloads stay yours.</h1>
      <p>Nyurwe does not upload a cloud history. Finished files remain in the folder you chose.</p>
      {status === "success" && (
        <div className="history-item">
          <Image src="/assets/forest-walk-thumbnail.png" width={104} height={64} alt="Forest walk thumbnail" />
          <span><strong>Amazing Forest Walk</strong><small>{format.title} {format.detail}</small></span>
          <CheckCircle size={24} weight="fill" />
        </div>
      )}
      <button className="stone-action" type="button" onClick={onReturn}>Return to download</button>
      <Botanicals className="utility-growth" />
    </section>
  );
}
