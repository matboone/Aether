"use client";

export function ResolutionSummary() {
  return (
    <div className="resolution-summary">
      <div className="resolution-stats">
        <div className="resolution-stat">
          <div className="resolution-stat__label">ORIGINAL</div>
          <div className="resolution-stat__value">$6,000</div>
        </div>
        <div className="resolution-stat">
          <div className="resolution-stat__label">DISPUTED</div>
          <div className="resolution-stat__value resolution-stat__value--teal">
            $5,550
          </div>
        </div>
        <div className="resolution-stat">
          <div className="resolution-stat__label">REMAINING</div>
          <div className="resolution-stat__value">$450</div>
        </div>
      </div>
      <div className="resolution-callout">
        <div className="resolution-callout__label">MONEY SAVED</div>
        <div className="resolution-callout__value">$5,550</div>
        <div className="resolution-callout__note">
          Resolved through charity care waiver
        </div>
        <div className="resolution-callout__accuracy">
          &check; Guaranteed Accuracy
        </div>
      </div>
      <div style={{ clear: "both" }} />
    </div>
  );
}
