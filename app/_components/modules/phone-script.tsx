"use client";

import { Phone } from "lucide-react";
import { SCRIPT_SECTIONS } from "@/app/_constants/dashboard";

export function PhoneScript() {
  return (
    <>
      <div className="phone-script__header">
        <div className="phone-script__header-left">
          <Phone size={16} /> Call Script &mdash; TriStar Billing Dept.
        </div>
        <button className="phone-script__copy-btn">Copy Script</button>
      </div>
      <div className="phone-script__body">
        {SCRIPT_SECTIONS.map((sec) => (
          <div key={sec.label} className="script-section">
            <div className="script-section__label">{sec.label}</div>
            {sec.isChip ? (
              <div className="script-phone-chip">{sec.text}</div>
            ) : (
              <div className="script-section__text">{sec.text}</div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
