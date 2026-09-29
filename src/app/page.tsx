"use client";

import Image from "next/image";
import {
  ArrowRight,
  Check,
  Clipboard,
  Clock3,
  Download,
  FolderOpen,
  Link2,
  LoaderCircle,
  MapPin,
  RefreshCcw,
  Settings2,
  Sparkles,
} from "lucide-react";
import { ForestNav } from "@/src/components/forest-nav";
import { DownloadSelector } from "@/src/components/download-selector";
import { QueuePanel } from "@/src/components/queue-panel";
import { RecentDownloads } from "@/src/components/recent-downloads";
import { StartupScreen } from "@/src/components/startup-screen";
import { useDownloader } from "@/src/hooks/use-downloader";

function durationLabel(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  return [hours, minutes, rest]
    .filter((_, index) => index > 0 || hours > 0)
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

export default function Home() {
  const app = useDownloader();
  if (app.initializing) return <StartupScreen />;

  const queueProps = {
    media: app.media ?? {
      title: "Morning Forest — A Calm Journey",
      channel: "Quiet Earth Studio",
      duration: 1484,
      thumbnail: "/assets/forest-walk-thumbnail.png",
      isPlaylist: false,
      availableHeights: [1080, 720],
    },
    kind: app.kind,
    detail: app.selectedOption.label,
    percent: app.percent,
    status: app.status,
    current: app.current,
    desktop: app.desktop,
    folder: app.folder,
    onPause: app.togglePause,
    onCancel: app.stop,
    setupNeeded: app.missingTools,
    onSetup: app.setupTools,
    settingUp: app.settingUp,
  };

  return (
    <main className="forest-shell" data-theme="forest-premium">
      <div className="forest-wallpaper" aria-hidden="true" />
      <div className="desktop-frame">
        <ForestNav activeView={app.activeView} onSelect={app.setActiveView} />
        <section className="app-stage">
          {app.activeView === "home" ? (
            <>
              <div className="main-column">
                <header className="hero-copy">
                  <h1>What would you like to save?</h1>
                </header>

                <section className="url-section" aria-label="YouTube link">
                  <div className={`input input-lg url-composer ${app.media ? "has-media" : ""}`}>
                    <Link2 size={21} />
                    <input
                      type="url"
                      inputMode="url"
                      placeholder="Paste a YouTube link"
                      value={app.url}
                      onChange={(event) => app.setUrl(event.target.value)}
                      disabled={app.running}
                      aria-label="YouTube link"
                    />
                    <button
                      className="btn paste-button"
                      type="button"
                      onClick={app.pasteUrl}
                      disabled={app.running}
                    >
                      <Clipboard size={17} />
                      Paste
                    </button>
                  </div>
                  {app.inspecting && (
                    <div className="link-feedback">
                      <LoaderCircle className="spin" size={15} />
                      Reading video details…
                    </div>
                  )}
                  {app.error && (
                    <div className="link-feedback error" role="alert">
                      {app.error}
                    </div>
                  )}
                </section>

                {app.media ? (
                  <div className="linked-content reveal-step">
                    <article className="glass-panel media-preview">
                      <div className="media-image">
                        <Image
                          src={app.media.thumbnail || "/assets/forest-walk-thumbnail.png"}
                          width={224}
                          height={126}
                          alt="Video thumbnail"
                          unoptimized
                        />
                        <span className="badge duration-badge">
                          <Clock3 size={12} />
                          {durationLabel(app.media.duration)}
                        </span>
                      </div>
                      <div className="media-details">
                        <span className="eyebrow">Link ready</span>
                        <h2>{app.media.title}</h2>
                        <p>{app.media.channel}</p>
                        <div>
                          <span className="badge badge-soft">
                            <Check size={12} />
                            YouTube
                          </span>
                          <button
                            className="btn btn-ghost btn-sm"
                            type="button"
                            onClick={() => app.setUrl("")}
                          >
                            <RefreshCcw size={14} />
                            Change link
                          </button>
                        </div>
                      </div>
                    </article>

                    <div className="glass-panel selection-panel">
                      <DownloadSelector
                        kind={app.kind}
                        onKindChange={app.setKind}
                        videoQuality={app.videoQuality}
                        onVideoQualityChange={app.setVideoQuality}
                        audioFormat={app.audioFormat}
                        onAudioFormatChange={app.setAudioFormat}
                        audioQuality={app.audioQuality}
                        onAudioQualityChange={app.setAudioQuality}
                        availableHeights={app.media.availableHeights}
                      />
                      <section className="download-summary">
                        <div className="summary-heading">
                          <span className="step-number">3</span>
                          <div>
                            <h2>Ready when you are</h2>
                          </div>
                        </div>
                        <div className="summary-grid">
                          <div>
                            <span>Type</span>
                            <strong>{app.kind[0].toUpperCase() + app.kind.slice(1)}</strong>
                          </div>
                          <div>
                            <span>Quality & format</span>
                            <strong>{app.selectedOption.label}</strong>
                          </div>
                          <div>
                            <span>Estimated size</span>
                            <strong>{app.selectedOption.size}</strong>
                          </div>
                          <button
                            className="summary-location"
                            type="button"
                            onClick={app.pickFolder}
                          >
                            <MapPin size={16} />
                            <span>Save location</span>
                            <strong>{app.folder || "Choose a folder"}</strong>
                          </button>
                        </div>
                        <button
                          className="btn btn-primary btn-lg download-now"
                          type="button"
                          onClick={() => app.start()}
                          disabled={!app.canDownload}
                        >
                          <Download size={19} />
                          Download now
                          <ArrowRight size={18} />
                        </button>
                      </section>
                    </div>
                  </div>
                ) : (
                  <section className="glass-panel link-empty">
                    <span className="link-empty-icon">
                      <Link2 size={26} />
                    </span>
                    <h2>Your next download starts here</h2>
                    <p>
                      Paste a valid video or playlist link to reveal format and quality choices.
                    </p>
                  </section>
                )}
              </div>
              <div className="side-column">
                <QueuePanel {...queueProps} />
              </div>
              <RecentDownloads />
            </>
          ) : app.activeView === "downloads" ? (
            <section className="utility-page">
              <header>
                <span className="eyebrow">Your library</span>
                <h1>Downloads</h1>
                <p>Active work and recently saved files, all in one quiet place.</p>
              </header>
              <div className="utility-two-col">
                <QueuePanel {...queueProps} />
                <RecentDownloads />
              </div>
            </section>
          ) : app.activeView === "playlists" ? (
            <section className="utility-page">
              <header>
                <span className="eyebrow">Collections</span>
                <h1>Playlists</h1>
                <p>Paste a playlist on Home and Forest Download will keep its order intact.</p>
              </header>
              <div className="glass-panel utility-empty">
                <FolderOpen size={28} />
                <h2>No saved playlists yet</h2>
                <p>Your playlist downloads will appear here.</p>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => app.setActiveView("home")}
                >
                  Start with a link
                </button>
              </div>
            </section>
          ) : (
            <section className="utility-page">
              <header>
                <span className="eyebrow">Preferences</span>
                <h1>Settings</h1>
                <p>Keep the destination and download engine tuned to your workflow.</p>
              </header>
              <div className="glass-panel settings-panel">
                <div>
                  <span>
                    <FolderOpen size={20} />
                  </span>
                  <p>
                    <strong>Save location</strong>
                    <small>{app.folder || "Choose a folder"}</small>
                  </p>
                  <button
                    className="btn btn-sm"
                    type="button"
                    onClick={app.pickFolder}
                    disabled={!app.desktop}
                  >
                    Change
                  </button>
                </div>
                <div>
                  <span>
                    <Settings2 size={20} />
                  </span>
                  <p>
                    <strong>Download engine</strong>
                    <small>{app.missingTools ? "Setup needed" : "Ready and private"}</small>
                  </p>
                  <button
                    className="btn btn-sm"
                    type="button"
                    onClick={app.setupTools}
                    disabled={!app.desktop || app.settingUp}
                  >
                    {app.settingUp ? app.setupText || "Updating…" : "Update"}
                  </button>
                </div>
              </div>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}
