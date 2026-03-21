"use client";

import { Minus, Plus } from "lucide-react";
import { INCOME_OPTIONS } from "@/app/_constants/dashboard";

interface IncomeSelectorProps {
  selectedIncome: string | null;
  householdSize: number;
  confirmed: boolean;
  onSelect: (opt: string) => void;
  onHouseholdChange: React.Dispatch<React.SetStateAction<number>>;
  onConfirm: () => void;
}

export function IncomeSelector({
  selectedIncome,
  householdSize,
  confirmed,
  onSelect,
  onHouseholdChange,
  onConfirm,
}: IncomeSelectorProps) {
  return (
    <>
      <div className="income-selector__title">
        What&apos;s your annual household income?
      </div>
      <div className="household-stepper">
        <span className="household-stepper__label">Household Size</span>
        <button
          className="stepper-btn"
          onClick={() => onHouseholdChange((h) => Math.max(1, h - 1))}
          disabled={confirmed}
        >
          <Minus size={14} />
        </button>
        <span className="stepper-value">{householdSize}</span>
        <button
          className="stepper-btn"
          onClick={() => onHouseholdChange((h) => Math.min(10, h + 1))}
          disabled={confirmed}
        >
          <Plus size={14} />
        </button>
      </div>
      <div className="income-grid">
        {INCOME_OPTIONS.map((opt) => (
          <button
            key={opt}
            className={`income-pill ${
              selectedIncome === opt ? "income-pill--selected" : ""
            } ${
              selectedIncome && selectedIncome !== opt && confirmed
                ? "income-pill--faded"
                : ""
            }`}
            onClick={() => !confirmed && onSelect(opt)}
            disabled={confirmed}
          >
            {opt}
          </button>
        ))}
      </div>
      {selectedIncome && !confirmed && (
        <button className="btn-primary btn-primary--full" onClick={onConfirm}>
          Confirm Selection
        </button>
      )}
    </>
  );
}
