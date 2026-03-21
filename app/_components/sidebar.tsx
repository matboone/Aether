"use client";

import { Settings } from "lucide-react";
import { SIDEBAR_ICONS } from "@/app/_constants/dashboard";

interface SidebarProps {
  activeNav: number;
  onNavChange: (idx: number) => void;
}

export function Sidebar({ activeNav, onNavChange }: SidebarProps) {
  return (
    <aside className="aether-sidebar">
      <div className="aether-sidebar__monogram">A</div>
      <nav className="aether-sidebar__nav">
        {SIDEBAR_ICONS.map(({ icon: Icon, label }, i) => (
          <button
            key={label}
            className={`aether-sidebar__icon ${
              i === activeNav ? "aether-sidebar__icon--active" : ""
            }`}
            onClick={() => onNavChange(i)}
            title={label}
          >
            <Icon size={18} />
          </button>
        ))}
        <div className="aether-sidebar__settings">
          <button className="aether-sidebar__icon" title="Settings">
            <Settings size={18} />
          </button>
        </div>
      </nav>
    </aside>
  );
}
