"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import "./dashboard.css";
import { useChatEngine } from "./_hooks/use-chat-engine";
import { STAGE_LABELS } from "./_constants/dashboard";
import { Sidebar } from "./_components/sidebar";
import { ChatThread } from "./_components/chat-thread";
import { ChatInput } from "./_components/chat-input";
import { SessionFactsPanel } from "./_components/session-facts";
import { SettingsDialog } from "./_components/settings-dialog";
import { ModuleRenderer } from "./_components/modules/module-renderer";
import { ArrowLeft } from "lucide-react";

type RightTab = "info" | "strategy";

const MIN_PANEL_W = 240;
const MAX_PANEL_W = 520;
const DEFAULT_PANEL_W = 290;

export default function AetherDashboard() {
  const engine = useChatEngine();
  const showWelcome = !engine.hasStarted;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [rightTab, setRightTab] = useState<RightTab>("info");

  /* ─── Draggable panel width ─── */
  const [panelW, setPanelW] = useState(DEFAULT_PANEL_W);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startW = useRef(DEFAULT_PANEL_W);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    startX.current = e.clientX;
    startW.current = panelW;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [panelW]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const delta = startX.current - e.clientX; // leftward = wider
    const next = Math.min(MAX_PANEL_W, Math.max(MIN_PANEL_W, startW.current + delta));
    setPanelW(next);
  }, []);

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  /* Show the right panel once we have any data */
  const hasFacts =
    engine.facts.hospitalName !== null ||
    engine.facts.hasInsurance !== null ||
    engine.facts.estimatedBillTotal !== null ||
    engine.facts.incomeBracket !== null ||
    engine.facts.negotiationOutcome !== null;

  const hasStrategy = engine.rightPanelModules.length > 0;
  const showRightPanel = hasFacts || hasStrategy;

  /* Auto-switch to strategy tab when strategy content appears */
  useEffect(() => {
    if (hasStrategy && rightTab === "info") {
      /* don't auto-switch if user has already toggled manually */
    }
  }, [hasStrategy, rightTab]);

  return (
    <div className="aether-dashboard">
      {/* ─── Left Sidebar ─── */}
      <Sidebar
        activeNav={engine.activeNav}
        onNavChange={engine.setActiveNav}
        onOpenSettings={() => setSettingsOpen(true)}
        profileName={engine.profile.accountName}
        profileStatus={engine.profile.status}
      />

      {/* ─── Chat Panel ─── */}
      <main className={`aether-chat ${showWelcome ? "aether-chat--welcome" : ""}`}>
        {showWelcome ? (
          <>
            <div className="welcome-hero">
              <div className="welcome-hero__monogram">A</div>
              <h1 className="welcome-hero__title">Aether</h1>
              <p className="welcome-hero__sub">
                Navigate medical bills with clarity.
                <br />
                <span className="welcome-hero__sub--muted">
                  Upload, analyze &amp; negotiate — step by step.
                </span>
              </p>
            </div>

            <div className="welcome-input-wrap">
              <ChatInput
                stage={engine.stage}
                inputValue={engine.inputValue}
                textareaRef={engine.textareaRef}
                onChipClick={engine.handleChipClick}
                onSend={engine.handleSend}
                onTextareaChange={engine.handleTextareaChange}
                onKeyDown={engine.handleKeyDown}
              />
            </div>

            <div className="welcome-features">
              <div className="welcome-feature-card">
                <span className="welcome-feature-card__icon">📄</span>
                <div className="welcome-feature-card__title">Bill Analysis</div>
                <div className="welcome-feature-card__desc">
                  Upload your bill and get an instant line-by-line breakdown with fair-price benchmarks.
                </div>
              </div>
              <div className="welcome-feature-card">
                <span className="welcome-feature-card__icon">💡</span>
                <div className="welcome-feature-card__title">Savings Finder</div>
                <div className="welcome-feature-card__desc">
                  Discover financial assistance programs and negotiation strategies you qualify for.
                </div>
              </div>
              <div className="welcome-feature-card">
                <span className="welcome-feature-card__icon">📞</span>
                <div className="welcome-feature-card__title">Call Scripts</div>
                <div className="welcome-feature-card__desc">
                  Get a ready-to-use phone script tailored to your exact situation and hospital.
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="aether-chat__topbar">
              <button
                className="aether-chat__back-btn"
                onClick={engine.clearSession}
                aria-label="Back to home"
              >
                <ArrowLeft size={18} />
              </button>
              <span key={engine.stage} className="aether-chat__breadcrumb">
                {STAGE_LABELS[engine.stage]}
              </span>
            </div>

            <ChatThread
              messages={engine.messages}
              isTyping={engine.isTyping}
              threadRef={engine.threadRef}
              engine={engine}
            />

            <ChatInput
              stage={engine.stage}
              inputValue={engine.inputValue}
              textareaRef={engine.textareaRef}
              onChipClick={engine.handleChipClick}
              onSend={engine.handleSend}
              onTextareaChange={engine.handleTextareaChange}
              onKeyDown={engine.handleKeyDown}
            />
          </>
        )}
      </main>

      {/* ─── Unified Right Panel (draggable, tabbed) ─── */}
      {showRightPanel && (
        <>
          {/* Drag handle */}
          <div
            className="right-panel__drag-handle"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />

          <aside
            className="right-panel"
            style={{ width: panelW }}
          >
            {/* Tab bar */}
            <div className="right-panel__tabs">
              <button
                type="button"
                className={`right-panel__tab ${rightTab === "info" ? "right-panel__tab--active" : ""}`}
                onClick={() => setRightTab("info")}
              >
                Session Info
              </button>
              {hasStrategy && (
                <button
                  type="button"
                  className={`right-panel__tab ${rightTab === "strategy" ? "right-panel__tab--active" : ""}`}
                  onClick={() => setRightTab("strategy")}
                >
                  Strategy
                </button>
              )}
            </div>

            {/* Tab content */}
            <div className="right-panel__content">
              {rightTab === "info" && (
                <SessionFactsPanel
                  facts={engine.facts}
                  flashFields={engine.flashFields}
                  summaryExpanded={engine.summaryExpanded}
                  openSections={engine.openSections}
                  techIdsOpen={engine.techIdsOpen}
                  onToggleSection={(key) =>
                    engine.setOpenSections((prev) => ({
                      ...prev,
                      [key]: !prev[key],
                    }))
                  }
                  onToggleTechIds={() => engine.setTechIdsOpen(!engine.techIdsOpen)}
                  onToggleSummary={() => engine.setSummaryExpanded(!engine.summaryExpanded)}
                  onClearSession={engine.clearSession}
                  onOpenSettings={() => setSettingsOpen(true)}
                />
              )}

              {rightTab === "strategy" && hasStrategy && (
                <div className="right-panel__strategy-body">
                  {engine.rightPanelModules.map((m, idx) => (
                    <ModuleRenderer key={m} moduleType={m} idx={idx} engine={engine} bare />
                  ))}
                </div>
              )}
            </div>
          </aside>
        </>
      )}

      {/* ─── Settings Dialog ─── */}
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        profile={engine.profile}
      />
    </div>
  );
}
