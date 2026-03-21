"use client";

import { FileText } from "lucide-react";

interface DocChipsProps {
  readonly nextActions: string[];
}

export function DocChips({ nextActions }: DocChipsProps) {
  return (
    <>
      <div className="doc-chips__label">GENERATED DOCUMENTS</div>
      <div className="doc-chips__row">
        {nextActions.slice(0, 4).map((action, idx) => (
          <div key={`${action}-${idx}`} className="doc-chip">
            <FileText size={18} className="doc-chip__icon" />
            <div className="doc-chip__name">Step {idx + 1} Brief</div>
            <div className="doc-chip__status">Ready</div>
            <button className="doc-chip__link">{action.slice(0, 42)}{action.length > 42 ? "…" : ""}</button>
          </div>
        ))}
      </div>
    </>
  );
}
