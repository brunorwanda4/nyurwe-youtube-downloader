"use client";

import { FolderOpen, GearSix, Leaf } from "@phosphor-icons/react";
import { Botanicals } from "./botanicals";

type SettingsViewProps = {
  desktop: boolean;
  folder: string;
  engineLabel: string;
  settingUp: boolean;
  onPickFolder: () => void;
  onSetupTools: () => void;
};

export function SettingsView({ desktop, folder, engineLabel, settingUp, onPickFolder, onSetupTools }: SettingsViewProps) {
  return (
    <section className="stone-card utility-view">
      <GearSix size={38} weight="duotone" />
      <span className="hero-kicker">Local settings</span>
      <h1>Quiet by default.</h1>
      <p>Your save folder and download engine live on this computer—never in a middleman cloud.</p>
      <div className="settings-row">
        <FolderOpen size={20} weight="fill" />
        <span><strong>Save location</strong><small>{folder || "Choose a folder in the desktop app"}</small></span>
        <button type="button" onClick={onPickFolder} disabled={!desktop}>Change</button>
      </div>
      <div className="settings-row">
        <Leaf size={20} weight="fill" />
        <span><strong>Download engine</strong><small>{engineLabel}</small></span>
        <button type="button" onClick={onSetupTools} disabled={!desktop || settingUp}>Update</button>
      </div>
      <Botanicals className="utility-growth" />
    </section>
  );
}
