"use client";

import { Check, FileAudio, ListVideo, Music2, Sparkles, Video } from "lucide-react";
import {
  AUDIO_FORMATS,
  AUDIO_QUALITIES,
  DOWNLOAD_TYPES,
  VIDEO_QUALITIES,
} from "@/src/lib/constants";
import { AudioFormat, AudioQuality, DownloadKind, VideoQuality } from "@/src/lib/types";

const typeIcons = { video: Video, audio: Music2, playlist: ListVideo };

export function FormatCard({
  id,
  title,
  description,
  selected,
  onSelect,
}: {
  id: DownloadKind;
  title: string;
  description: string;
  selected: boolean;
  onSelect: (kind: DownloadKind) => void;
}) {
  const Icon = typeIcons[id];
  return (
    <button
      className={`card format-card ${selected ? "is-selected" : ""}`}
      type="button"
      onClick={() => onSelect(id)}
      aria-pressed={selected}
    >
      <span className="format-icon">
        <Icon size={23} strokeWidth={1.7} />
      </span>
      <span className="format-copy">
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <span className="selection-check">
        <Check size={13} strokeWidth={3} />
      </span>
    </button>
  );
}

export function QualityOption({
  title,
  detail,
  size,
  selected,
  disabled,
  onSelect,
}: {
  title: string;
  detail: string;
  size: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`quality-option ${selected ? "is-selected" : ""}`}
      type="button"
      disabled={disabled}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <span className="radio-dot">
        <span />
      </span>
      <span className="quality-copy">
        <strong>{title}</strong>
        <small>{detail}</small>
      </span>
      <span className="quality-size">{disabled ? "Unavailable" : size}</span>
    </button>
  );
}

export function DownloadSelector({
  kind,
  onKindChange,
  videoQuality,
  onVideoQualityChange,
  audioFormat,
  onAudioFormatChange,
  audioQuality,
  onAudioQualityChange,
  availableHeights,
}: {
  kind: DownloadKind;
  onKindChange: (value: DownloadKind) => void;
  videoQuality: VideoQuality;
  onVideoQualityChange: (value: VideoQuality) => void;
  audioFormat: AudioFormat;
  onAudioFormatChange: (value: AudioFormat) => void;
  audioQuality: AudioQuality;
  onAudioQualityChange: (value: AudioQuality) => void;
  availableHeights: number[];
}) {
  return (
    <div className="selector-flow">
      <section className="selection-step">
        <div className="step-heading">
          <span>1</span>
          <div>
            <h2>Choose what to download</h2>
          </div>
        </div>
        <div className="format-grid">
          {DOWNLOAD_TYPES.map((item) => (
            <FormatCard
              key={item.id}
              {...item}
              selected={kind === item.id}
              onSelect={onKindChange}
            />
          ))}
        </div>
      </section>
      {kind === "video" && (
        <section className="selection-step reveal-step">
          <div className="step-heading">
            <span>2</span>
            <div>
              <h2>Choose video quality</h2>
            </div>
          </div>
          <div className="quality-grid">
            {VIDEO_QUALITIES.map((option) => {
              const disabled =
                option.id !== "best" && !availableHeights.includes(Number(option.id));
              return (
                <QualityOption
                  key={option.id}
                  title={option.label}
                  detail={option.detail}
                  size={option.size}
                  selected={videoQuality === option.id}
                  disabled={disabled}
                  onSelect={() => onVideoQualityChange(option.id)}
                />
              );
            })}
          </div>
        </section>
      )}
      {kind === "audio" && (
        <section className="selection-step reveal-step">
          <div className="step-heading">
            <span>2</span>
            <div>
              <h2>Choose audio format</h2>
            </div>
          </div>
          <div className="audio-format-grid">
            {AUDIO_FORMATS.map((format) => (
              <button
                key={format.id}
                className={`card audio-format-card ${audioFormat === format.id ? "is-selected" : ""}`}
                type="button"
                onClick={() => onAudioFormatChange(format.id)}
              >
                <FileAudio size={20} strokeWidth={1.7} />
                <span>
                  <strong>{format.title}</strong>
                  <small>{format.description}</small>
                </span>
              </button>
            ))}
          </div>
          <div className="quality-chips" aria-label="Audio quality">
            {AUDIO_QUALITIES.map((quality) => (
              <button
                key={quality.id}
                className={`btn btn-sm ${audioQuality === quality.id ? "is-selected" : "btn-ghost"}`}
                type="button"
                onClick={() => onAudioQualityChange(quality.id)}
              >
                {quality.id === "best" && <Sparkles size={14} />}
                {quality.label}
              </button>
            ))}
          </div>
        </section>
      )}
      {kind === "playlist" && (
        <section className="playlist-note reveal-step">
          <ListVideo size={19} />
          <span>
            <strong>The complete playlist will be saved.</strong>
            <small>
              Forest Download keeps the original order and chooses the best compatible video
              quality.
            </small>
          </span>
        </section>
      )}
    </div>
  );
}
