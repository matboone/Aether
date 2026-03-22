"use client";

interface ActionPlanProps {
  readonly nextActions: string[];
}

export function ActionPlan({ nextActions }: ActionPlanProps) {
  return (
    <>
      <div className="action-plan__header">
        <div className="action-plan__title">Your Action Plan</div>
        <div className="action-plan__sub">Recommended steps in order</div>
      </div>
      {nextActions.length === 0 ? (
        <p className="action-plan__empty">Steps will show up here as your plan takes shape.</p>
      ) : (
      <div className="stepper-list">
        {nextActions.map((step, i) => {
          const status = i === 0 ? "active" : "pending";
          return (
            <div key={step} className="step-item">
            <div className="step-item__left">
              <div className={`step-circle step-circle--${status}`}>
                {i + 1}
              </div>
              {i < nextActions.length - 1 && (
                <div
                  className="step-connector"
                />
              )}
            </div>
            <div className="step-item__content">
              <div className="step-item__title">Step {i + 1}</div>
              <div className="step-item__desc">{step}</div>
              <span className={`step-chip step-chip--${status}`}>
                {status === "active" && (
                  <>
                    <span className="pulse-dot" /> In Progress
                  </>
                )}
                {status === "pending" && "Pending"}
              </span>
            </div>
            </div>
          );
        })}
      </div>
      )}
    </>
  );
}
