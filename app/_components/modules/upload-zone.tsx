"use client";

import { useRef } from "react";
import { UploadCloud, FileText, Check } from "lucide-react";

interface UploadZoneProps {
  readonly uploaded: boolean;
  readonly uploading: boolean;
  readonly filename: string | null;
  readonly sizeLabel: string | null;
  readonly onUpload: (file: File) => void;
}

export function UploadZone({ uploaded, uploading, filename, sizeLabel, onUpload }: UploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    onUpload(selected);
    event.target.value = "";
  };

  if (uploaded) {
    return (
      <div className="bill-receipt">
        <FileText size={20} className="bill-receipt__icon" />
        <div className="bill-receipt__info">
          <div className="bill-receipt__name">{filename ?? "Uploaded bill"}</div>
          <div className="bill-receipt__size">{sizeLabel ?? "Uploaded"}</div>
        </div>
        <div className="bill-receipt__badge">
          <Check size={12} /> Uploaded
        </div>
      </div>
    );
  }

  return (
    <button type="button" className="upload-zone" onClick={handleChooseFile} disabled={uploading}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <div className="upload-zone__icon">
        <UploadCloud size={28} />
      </div>
      <div className="upload-zone__title">{uploading ? "Uploading bill…" : "Drop your bill here"}</div>
      <div className="upload-zone__sub">
        PDF or photo &mdash; we&apos;ll extract everything
      </div>
      <span className="btn-primary">
        {uploading ? "Uploading…" : "Choose File"}
      </span>
    </button>
  );
}
