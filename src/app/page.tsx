"use client";

import { Scene } from "@/src/components/scene";
import { StartupScreen } from "@/src/components/startup-screen";
import { ForestNav } from "@/src/components/forest-nav";
import { DownloadCard } from "@/src/components/download-card";
import { PreviewCard } from "@/src/components/preview-card";
import { ProgressPanel } from "@/src/components/progress-panel";
import { StatusPanel } from "@/src/components/status-panel";
import { HistoryView } from "@/src/components/history-view";
import { SettingsView } from "@/src/components/settings-view";
import { ForestFooter } from "@/src/components/forest-footer";
import { useDownloader } from "@/src/hooks/use-downloader";

export default function Home() {
  const app = useDownloader();

  if (app.initializing) return <StartupScreen />;

  return (
    <main className="forest-app relative min-h-screen overflow-x-hidden text-white">
      <Scene />
      <div className="forest-backdrop" aria-hidden="true" />
      <div className="forest-app__content">
        <ForestNav activeView={app.activeView} onSelect={app.setActiveView} />

        {app.activeView === "download" ? (
          <div className="forest-workspace">
            <div className="download-column">
              <DownloadCard
                desktop={app.desktop}
                toolsChecked={app.tools !== null}
                missingTools={app.missingTools}
                engineLabel={app.engineLabel}
                engineVersion={app.engineVersion}
                settingUp={app.settingUp}
                setupText={app.setupText}
                onSetupTools={app.setupTools}
                url={app.url}
                onUrlChange={app.setUrl}
                folder={app.folder}
                onPickFolder={app.pickFolder}
                error={app.error}
                running={app.running}
                canDownload={app.canDownload}
                percent={app.percent}
                progressLabel={app.progressLabel}
                format={app.format}
                onStart={app.start}
                onStop={app.stop}
              />

              <PreviewCard
                previewState={app.previewState}
                running={app.running}
                selectedFormat={app.selectedFormat}
                onSelectFormat={app.setSelectedFormat}
              />

              {(app.status !== "idle" || app.log.length > 0) && (
                <ProgressPanel
                  status={app.status}
                  desktop={app.desktop}
                  folder={app.folder}
                  current={app.current}
                  statusHeading={app.statusHeading}
                  progressLabel={app.progressLabel}
                  percent={app.percent}
                  log={app.log}
                  logRef={app.logRef}
                />
              )}
            </div>

            <StatusPanel
              status={app.status}
              running={app.running}
              statusHeading={app.statusHeading}
              progressLabel={app.progressLabel}
              current={app.current}
              percent={app.percent}
            />
          </div>
        ) : app.activeView === "history" ? (
          <HistoryView status={app.status} format={app.format} onReturn={() => app.setActiveView("download")} />
        ) : (
          <SettingsView
            desktop={app.desktop}
            folder={app.folder}
            engineLabel={app.engineLabel}
            settingUp={app.settingUp}
            onPickFolder={app.pickFolder}
            onSetupTools={app.setupTools}
          />
        )}

        <ForestFooter />
      </div>
    </main>
  );
}
