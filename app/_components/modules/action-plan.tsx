"use client";

import { Check } from "lucide-react";
import { ACTION_STEPS } from "@/app/_constants/dashboard";

export function ActionPlan() {
  return (
    <>
      <div className="action-plan__header">
        <div className="action-plan__title">Your Action Plan</div>
        <div className="action-plan__sub">Recommended steps in order</div>
      </div>
      <div className="stepper-list">
        {ACTION_STEPS.map((step, i) => (
          <div key={step.title} className="step-item">
            <div className="step-item__left">
              <div className={`step-circle step-circle--${step.status}`}>
                {step.status === "completed" ? <Check size={14} /> : i + 1}
              </div>
              {i < ACTION_STEPS.length - 1 && (
                <div
                  className={`step-connector ${step.status === "completed" ? "step-connector--filled" : ""}`}
                />
              )}
            </div>
            <div className="step-item__content">
              <div className="step-item__title">{step.title}</div>
              <div className="step-item__desc">{step.desc}</div>
              <span className={`step-chip step-chip--${step.status}`}>
                {step.status === "completed" && (
                  <>
                    <Check size={10} /> Completed
                  </>
                )}
                {step.status === "active" && (
                  <>
                    <span className="pulse-dot" /> In Progress
                  </>
                )}
                {step.status === "pending" && "Pending"}
              </span>
              {step.status === "active" && (
                <div style={{ marginTop: "0.4rem" }}>
                  <button
                    className="btn-secondary"
                    style={{ fontSize: "0.8rem", padding: "0.4rem 0.875rem" }}
                  >
                    View Application Draft
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
