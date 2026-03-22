"use client";

import { FileText } from "lucide-react";
import { jsPDF } from "jspdf";

interface DocChipsProps {
  readonly nextActions: string[];
  readonly phoneScript: string[];
  readonly hospitalName?: string | null;
}

function sanitizeFilenamePart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/(^-|-$)/g, "")
    .slice(0, 36);
}

function downloadPdf(filename: string, title: string, lines: string[]) {
  const pdf = new jsPDF({ unit: "pt", format: "letter" });
  const marginLeft = 48;
  const maxWidth = 516;
  let y = 60;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text(title, marginLeft, y);
  y += 22;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  const dateLine = `Generated: ${new Date().toLocaleString()}`;
  pdf.text(dateLine, marginLeft, y);
  y += 24;

  for (const line of lines) {
    const wrapped = pdf.splitTextToSize(line, maxWidth) as string[];
    if (y > 740) {
      pdf.addPage();
      y = 60;
    }
    pdf.text(wrapped, marginLeft, y);
    y += wrapped.length * 14 + 8;
  }

  pdf.save(filename);
}

export function DocChips({ nextActions, phoneScript, hospitalName }: DocChipsProps) {
  const scope = sanitizeFilenamePart(hospitalName ?? "aether");

  const strategyLines = nextActions.length > 0
    ? nextActions.map((action, idx) => `Step ${idx + 1}: ${action}`)
    : ["Strategy draft is not available yet."];

  const callScriptLines = phoneScript.length > 0
    ? phoneScript.map((line, idx) => `Section ${idx + 1}: ${line}`)
    : ["Call script is not available yet."];

  return (
    <>
      <div className="doc-chips__label">GENERATED DOCUMENTS</div>
      <div className="doc-chips__row">
        <div className="doc-chip">
          <FileText size={18} className="doc-chip__icon" />
          <div className="doc-chip__name">Strategy Draft PDF</div>
          <div className="doc-chip__status">Ready</div>
          <button
            type="button"
            className="doc-chip__link"
            onClick={() =>
              downloadPdf(
                `${scope || "aether"}-strategy-draft.pdf`,
                "Aether Strategy Draft",
                strategyLines,
              )
            }
          >
            Download PDF
          </button>
        </div>

        <div className="doc-chip">
          <FileText size={18} className="doc-chip__icon" />
          <div className="doc-chip__name">Call Script PDF</div>
          <div className="doc-chip__status">Ready</div>
          <button
            type="button"
            className="doc-chip__link"
            onClick={() =>
              downloadPdf(
                `${scope || "aether"}-call-script.pdf`,
                "Aether Call Script",
                callScriptLines,
              )
            }
          >
            Download PDF
          </button>
        </div>
      </div>
    </>
  );
}
