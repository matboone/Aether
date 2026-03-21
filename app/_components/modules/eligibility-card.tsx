"use client";

export function EligibilityCard() {
  return (
    <div className="eligibility-card">
      <div className="eligibility-card__icon-area">&check;</div>
      <div className="eligibility-card__headline">Full Waiver Likely</div>
      <div className="eligibility-card__sub">
        Based on TriStar&apos;s HCA charity care policy, your income bracket
        qualifies for complete waiver of emergency care charges.
      </div>
      <div className="savings-strip">
        <span className="savings-strip__label">Estimated savings:</span>
        <span className="savings-strip__value">
          40&ndash;100% of your balance
        </span>
      </div>
      <div className="eligibility-card__actions">
        <button className="btn-primary">Generate Assistance Letter</button>
        <button className="btn-secondary">View Charity Care Policy</button>
      </div>
    </div>
  );
}
