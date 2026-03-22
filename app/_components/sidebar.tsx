"use client";

import { Settings } from "lucide-react";
import { SIDEBAR_ICONS } from "@/app/_constants/dashboard";
import { CaduceusMark } from "./caduceus-mark";

interface SidebarProps {
  readonly activeNav: number;
  readonly onNavChange: (idx: number) => void;
  readonly onOpenSettings: () => void;
  readonly profileName: string;
  readonly profileStatus: string;
}

export function Sidebar({ activeNav, onNavChange, onOpenSettings, profileName, profileStatus }: SidebarProps) {
  return (
    <aside className="aether-sidebar">
      <div className="aether-sidebar__monogram">
        <CaduceusMark size={38} />
      </div>
      <nav className="aether-sidebar__nav">
        {SIDEBAR_ICONS.map(({ icon: Icon, label }, i) => (
          <button
            key={label}
            className={`aether-sidebar__icon ${
              i === activeNav ? "aether-sidebar__icon--active" : ""
            }`}
            onClick={() => {
              /* Chat history (index 1): second click closes the rail */
              if (i === 1 && activeNav === 1) {
                onNavChange(0);
              } else {
                onNavChange(i);
              }
            }}
            title={label}
          >
            <Icon size={18} />
          </button>
        ))}
        <div className="aether-sidebar__settings">
          <button
            className="aether-sidebar__icon"
            title="Settings"
            onClick={onOpenSettings}
          >
            <Settings size={18} />
          </button>
        </div>
      </nav>

      <button className="aether-sidebar__profile" onClick={onOpenSettings} title={`${profileName} · ${profileStatus}`}>
        <span className="aether-sidebar__profile-avatar">{profileName.slice(0, 1)}</span>
        <span className="aether-sidebar__profile-dot" />
      </button>
    </aside>
  );
}
