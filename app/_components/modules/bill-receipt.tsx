"use client";

import { FileText, Check } from "lucide-react";

export function BillReceipt() {
  return (
    <div className="bill-receipt">
      <FileText size={20} className="bill-receipt__icon" />
      <div className="bill-receipt__info">
        <div className="bill-receipt__name">Cigna_Invoice_2001321.pdf</div>
        <div className="bill-receipt__size">2.4 MB</div>
      </div>
      <div className="bill-receipt__badge">
        <Check size={12} /> Uploaded
      </div>
    </div>
  );
}
