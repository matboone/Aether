"use client";

import { X, Moon, Sun, Gauge, PanelRightOpen, Rows3, Rabbit, RefreshCcw } from "lucide-react";
import { useEffect } from "react";

interface DashboardPreferences {
  readonly compactDensity: boolean;
  readonly reduceMotion: boolean;
  readonly autoOpenPanel: boolean;
  readonly fastModuleReveal: boolean;
  readonly rememberRightTab: boolean;
}

interface SettingsDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly profile: {
    accountId: string | null;
    accountName: string;
    status: string;
  };
  readonly isDark: boolean;
  readonly onToggleDark: () => void;
  readonly preferences: DashboardPreferences;
  readonly onSetPreference: <K extends keyof DashboardPreferences>(
    key: K,
    value: DashboardPreferences[K],
  ) => void;
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

export function SettingsDialog({
  open,
  onClose,
  profile,
  isDark,
  onToggleDark,
  preferences,
  onSetPreference,
}: SettingsDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    globalThis.addEventListener("keydown", onKeyDown);
    return () => {
      globalThis.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="settings-overlay">
      <dialog className="settings-dialog" open>
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
                {isDark ? <Moon size={16} /> : <Sun size={16} />}
                <span>Dark mode</span>
              </div>
              <ToggleSwitch checked={isDark} onChange={() => onToggleDark()} />
            </div>
          </div>

          {/* Experience */}
          <div className="settings-section">
            <div className="settings-section__label">Experience</div>
            <div className="settings-row">
              <div className="settings-row__info">
                <PanelRightOpen size={16} />
                <div>
                  <span>Auto-open Session panel</span>
                  <div className="settings-row__hint">Opens Session Info automatically after a case starts.</div>
                </div>
              </div>
              <ToggleSwitch
                checked={preferences.autoOpenPanel}
                onChange={(v) => onSetPreference("autoOpenPanel", v)}
              />
            </div>
            <div className="settings-row">
              <div className="settings-row__info">
                <Rabbit size={16} />
                <div>
                  <span>Fast module reveal</span>
                  <div className="settings-row__hint">Skips staged loading pauses and shows modules immediately.</div>
                </div>
              </div>
              <ToggleSwitch
                checked={preferences.fastModuleReveal}
                onChange={(v) => onSetPreference("fastModuleReveal", v)}
              />
            </div>
            <div className="settings-row">
              <div className="settings-row__info">
                <Rows3 size={16} />
                <div>
                  <span>Compact chat density</span>
                  <div className="settings-row__hint">Tightens chat spacing so more context fits on screen.</div>
                </div>
              </div>
              <ToggleSwitch
                checked={preferences.compactDensity}
                onChange={(v) => onSetPreference("compactDensity", v)}
              />
            </div>
            <div className="settings-row">
              <div className="settings-row__info">
                <Gauge size={16} />
                <div>
                  <span>Reduce motion</span>
                  <div className="settings-row__hint">Turns off most UI animations and transitions.</div>
                </div>
              </div>
              <ToggleSwitch
                checked={preferences.reduceMotion}
                onChange={(v) => onSetPreference("reduceMotion", v)}
              />
            </div>
            <div className="settings-row">
              <div className="settings-row__info">
                <RefreshCcw size={16} />
                <div>
                  <span>Remember Strategy tab</span>
                  <div className="settings-row__hint">Keeps your last open right-panel tab between visits.</div>
                </div>
              </div>
              <ToggleSwitch
                checked={preferences.rememberRightTab}
                onChange={(v) => onSetPreference("rememberRightTab", v)}
              />
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
            <p className="settings-attribution">
              Caduceus icon by{" "}
              <a href="https://www.freepik.com" target="_blank" rel="noopener noreferrer">
                Freepik
              </a>{" "}
              on{" "}
              <a
                href="https://www.flaticon.com/free-icons/caduceus"
                target="_blank"
                rel="noopener noreferrer"
              >
                Flaticon
              </a>
              .
            </p>
          </div>
        </div>
      </dialog>
    </div>
  );
}
