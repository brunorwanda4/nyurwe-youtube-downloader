"use client";

import Image from "next/image";
import { CircleNotch, MusicNotes, VideoCamera, YoutubeLogo } from "@phosphor-icons/react";
import { Botanicals } from "./botanicals";
import { FORMATS } from "@/src/lib/constants";
import { FormatId, PreviewState } from "@/src/lib/types";

type PreviewCardProps = {
  previewState: PreviewState;
  running: boolean;
  selectedFormat: FormatId;
  onSelectFormat: (id: FormatId) => void;
};

export function PreviewCard({ previewState, running, selectedFormat, onSelectFormat }: PreviewCardProps) {
  return (
    <section className={`stone-card preview-stone ${previewState}`} aria-label="Selected video preview">
      {previewState === "loading" ? (
        <div className="preview-loading" role="status">
          <CircleNotch className="spin" size={29} />
          <strong>Reading the forest path…</strong>
          <span>Checking the video and available formats</span>
        </div>
      ) : (
        <>
          <div className="thumbnail-wrap">
            <Image
              src="/assets/forest-walk-thumbnail.png"
              fill
              sizes="(max-width: 760px) 90vw, 260px"
              alt="A mossy walking trail through an ancient forest"
              priority
            />
            <span className="duration">10:42</span>
          </div>
          <div className="preview-details">
            <div className="preview-title">
              <div><span>Video preview</span><h2>Amazing Forest Walk</h2></div>
              <YoutubeLogo size={22} weight="fill" />
            </div>
            <fieldset className="format-stones" disabled={running}>
              <legend className="sr-only">Choose download format</legend>
              {FORMATS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={selectedFormat === item.id ? "selected" : ""}
                  aria-pressed={selectedFormat === item.id}
                  onClick={() => !running && onSelectFormat(item.id)}
                >
                  {item.mode === "audio" ? <MusicNotes size={16} weight="fill" /> : <VideoCamera size={16} weight="fill" />}
                  <span><strong>{item.title}</strong><small>{item.detail}</small></span>
                </button>
              ))}
            </fieldset>
          </div>
        </>
      )}
      <Botanicals className="preview-botanicals" />
    </section>
  );
}
