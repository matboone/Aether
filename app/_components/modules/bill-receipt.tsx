"use client";

import { FileText, Check } from "lucide-react";

export function BillReceipt({
  filename = "Cigna_Invoice_12345.pdf",
  size = "2.4 MB",
}: {
  filename?: string;
  size?: string;
}) {
  return (
    <div className="bill-receipt">
      <FileText size={20} className="bill-receipt__icon" />
      <div className="bill-receipt__info">
        <div className="bill-receipt__name">{filename}</div>
        <div className="bill-receipt__size">{size}</div>
      </div>
      <div className="bill-receipt__badge">
        <Check size={12} /> Uploaded
      </div>
    </div>
  );
}
