"use client";

import { Phone } from "lucide-react";

interface PhoneScriptProps {
  readonly hospitalName?: string | null;
  readonly lines: string[];
}

export function PhoneScript({ hospitalName, lines }: PhoneScriptProps) {
  return (
    <>
      <div className="phone-script__header">
        <div className="phone-script__header-left">
          <Phone size={16} /> Call Script &mdash; {hospitalName ?? "Billing Dept."}
        </div>
      </div>
      <div className="phone-script__body">
        {lines.map((line, idx) => (
          <div key={`${line}-${idx}`} className="script-section">
            <div className="script-section__label">Section {idx + 1}</div>
            <div className="script-section__text">{line}</div>
          </div>
        ))}
      </div>
    </>
  );
}
