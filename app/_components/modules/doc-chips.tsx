"use client";

import { FileText } from "lucide-react";
import { DOCUMENTS } from "@/app/_constants/dashboard";

export function DocChips() {
  return (
    <>
      <div className="doc-chips__label">GENERATED DOCUMENTS</div>
      <div className="doc-chips__row">
        {DOCUMENTS.map((doc) => (
          <div key={doc.name} className="doc-chip">
            <FileText size={18} className="doc-chip__icon" />
            <div className="doc-chip__name">{doc.name}</div>
            <div className="doc-chip__status">{doc.status}</div>
            <button className="doc-chip__link">View Draft &rarr;</button>
          </div>
        ))}
      </div>
    </>
  );
}
