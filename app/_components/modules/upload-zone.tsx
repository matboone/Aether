"use client";

import { UploadCloud, FileText, Check } from "lucide-react";

interface UploadZoneProps {
  readonly uploaded: boolean;
  readonly onUpload: () => void;
}

export function UploadZone({ uploaded, onUpload }: UploadZoneProps) {
  if (uploaded) {
    return (
      <div className="bill-receipt">
        <FileText size={20} className="bill-receipt__icon" />
        <div className="bill-receipt__info">
          <div className="bill-receipt__name">TriStar_Invoice_89211.pdf</div>
          <div className="bill-receipt__size">2.4 MB</div>
        </div>
        <div className="bill-receipt__badge">
          <Check size={12} /> Uploaded
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="upload-zone"
      onClick={onUpload}
    >
      <div className="upload-zone__icon">
        <UploadCloud size={28} />
      </div>
      <div className="upload-zone__title">Drop your bill here</div>
      <div className="upload-zone__sub">
        PDF or photo &mdash; we&apos;ll extract everything
      </div>
      <span className="btn-primary">
        Choose File
      </span>
    </button>
  );
}
