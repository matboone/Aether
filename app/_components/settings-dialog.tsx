"use client";

import { X, Moon, Sun, Bell, BellOff, Volume2, VolumeX, Shield } from "lucide-react";
import { useState } from "react";

interface SettingsDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly profile: {
    accountId: string | null;
    accountName: string;
    status: string;
  };
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  readonly checked: boolean;
  readonly onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      className={`settings-toggle ${checked ? "settings-toggle--on" : ""}`}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
    >
      <span className="settings-toggle__thumb" />
    </button>
  );
}

export function SettingsDialog({ open, onClose, profile }: SettingsDialogProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);

  if (!open) return null;

  return (
    <div
      className="settings-overlay"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      role="button"
      tabIndex={0}
    >
      <div
        className="settings-dialog"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="settings-dialog__header">
          <h2 className="settings-dialog__title">Settings</h2>
          <button
            className="settings-dialog__close"
            onClick={onClose}
            aria-label="Close settings"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sections */}
        <div className="settings-dialog__body">
          <div className="settings-section">
            <div className="settings-section__label">Profile</div>
            <div className="settings-profile">
              <div className="settings-profile__avatar">{profile.accountName.slice(0, 1)}</div>
              <div>
                <div className="settings-profile__name">{profile.accountName}</div>
                <div className="settings-profile__meta">{profile.accountId ?? "No account yet"}</div>
                <div className="settings-profile__meta">Status: {profile.status}</div>
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="settings-section">
            <div className="settings-section__label">Appearance</div>
            <div className="settings-row">
              <div className="settings-row__info">
                {darkMode ? <Moon size={16} /> : <Sun size={16} />}
                <span>Dark mode</span>
              </div>
              <ToggleSwitch checked={darkMode} onChange={setDarkMode} />
            </div>
          </div>

          {/* Notifications */}
          <div className="settings-section">
            <div className="settings-section__label">Notifications</div>
            <div className="settings-row">
              <div className="settings-row__info">
                {notifications ? <Bell size={16} /> : <BellOff size={16} />}
                <span>Push notifications</span>
              </div>
              <ToggleSwitch checked={notifications} onChange={setNotifications} />
            </div>
            <div className="settings-row">
              <div className="settings-row__info">
                {soundEffects ? <Volume2 size={16} /> : <VolumeX size={16} />}
                <span>Sound effects</span>
              </div>
              <ToggleSwitch checked={soundEffects} onChange={setSoundEffects} />
            </div>
          </div>

          {/* Privacy */}
          <div className="settings-section">
            <div className="settings-section__label">Privacy</div>
            <div className="settings-row">
              <div className="settings-row__info">
                <Shield size={16} />
                <span>Anonymous usage data</span>
              </div>
              <ToggleSwitch checked={dataSharing} onChange={setDataSharing} />
            </div>
          </div>

          {/* About */}
          <div className="settings-section">
            <div className="settings-section__label">About</div>
            <div className="settings-about">
              <div className="settings-about__logo">A</div>
              <div>
                <div className="settings-about__name">Aether</div>
                <div className="settings-about__version">v1.0.0 beta</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
