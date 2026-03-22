"use client";

import { useState, useEffect } from "react";
import "./dashboard.css";
import { useChatEngine } from "./_hooks/use-chat-engine";
import { STAGE_LABELS } from "./_constants/dashboard";
import { Sidebar } from "./_components/sidebar";
import { ChatThread } from "./_components/chat-thread";
import { ChatInput } from "./_components/chat-input";
import { SessionFactsPanel } from "./_components/session-facts";
import { SettingsDialog } from "./_components/settings-dialog";
import { ModuleRenderer } from "./_components/modules/module-renderer";
import { StrategyChecklistPlaceholder } from "./_components/modules/strategy-checklist-placeholder";
import { ArrowLeft, FileText, Lightbulb, Phone, PanelRightClose, PanelRightOpen } from "lucide-react";
import { CaduceusIcon } from "./_components/caduceus-icon";

type RightTab = "info" | "strategy";

export default function AetherDashboard() {
  const engine = useChatEngine();
  const showWelcome = !engine.hasStarted;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [rightTab, setRightTab] = useState<RightTab>("info");
  const [panelOpen, setPanelOpen] = useState(false);

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
    if (!hasStrategy && rightTab === "strategy") {
      setRightTab("info");
    }
  }, [hasStrategy, rightTab]);

  useEffect(() => {
    if (engine.uploaded || engine.facts.uploadedBillId) {
      setPanelOpen(true);
    }
  }, [engine.uploaded, engine.facts.uploadedBillId]);

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
              <div className="welcome-hero__monogram">
                <CaduceusIcon size={40} />
              </div>
              <h1 className="welcome-hero__title">Aether</h1>
              <p className="welcome-hero__sub">
                Navigate medical bills with clarity.
              </p>
            </div>

            <div className="welcome-input-wrap">
              <ChatInput
                stage={engine.stage}
                suggestions={engine.suggestionChips}
                inputValue={engine.inputValue}
                textareaRef={engine.textareaRef}
                onChipClick={engine.handleChipClick}
                onAttachFile={engine.handleUpload}
                onSend={engine.handleSend}
                onTextareaChange={engine.handleTextareaChange}
                onKeyDown={engine.handleKeyDown}
              />
            </div>

            <div className="welcome-features">
              <div className="welcome-feature-card">
                <FileText size={20} className="welcome-feature-card__icon" />
                <div className="welcome-feature-card__title">Bill Analysis</div>
                <div className="welcome-feature-card__desc">
                  Upload your bill and get an instant line-by-line breakdown with fair-price benchmarks.
                </div>
              </div>
              <div className="welcome-feature-card">
                <Lightbulb size={20} className="welcome-feature-card__icon" />
                <div className="welcome-feature-card__title">Savings Finder</div>
                <div className="welcome-feature-card__desc">
                  Discover financial assistance programs and negotiation strategies you qualify for.
                </div>
              </div>
              <div className="welcome-feature-card">
                <Phone size={20} className="welcome-feature-card__icon" />
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
                {engine.loadingStepNumber !== null
                  ? `STEP ${engine.loadingStepNumber}: LOADING`
                  : STAGE_LABELS[engine.stage]}
              </span>

              {showRightPanel && (
                <button
                  className="aether-chat__panel-toggle"
                  onClick={() => setPanelOpen((p) => !p)}
                  aria-label={panelOpen ? "Hide side panel" : "Show side panel"}
                >
                  {panelOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
                </button>
              )}
            </div>

            <ChatThread
              messages={engine.messages}
              isTyping={engine.isTyping}
              threadRef={engine.threadRef}
              engine={engine}
            />

            <ChatInput
              stage={engine.stage}
              suggestions={engine.suggestionChips}
              inputValue={engine.inputValue}
              textareaRef={engine.textareaRef}
              onChipClick={engine.handleChipClick}
              onAttachFile={engine.handleUpload}
              onSend={engine.handleSend}
              onTextareaChange={engine.handleTextareaChange}
              onKeyDown={engine.handleKeyDown}
            />
          </>
        )}
      </main>

      {/* ─── Right Panel (fixed overlay, slide in/out) ─── */}
      {showRightPanel && (
        <aside
          className={`right-panel${panelOpen ? "" : " right-panel--hidden"}`}
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
              <button
                type="button"
                className={`right-panel__tab ${rightTab === "strategy" ? "right-panel__tab--active" : ""}`}
                onClick={() => setRightTab("strategy")}
              >
                Strategy
              </button>
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
                />
              )}

              {rightTab === "strategy" && (
                <div className="right-panel__strategy-body">
                  <StrategyChecklistPlaceholder stage={engine.stage} isLoading={engine.isTyping || engine.isUploading} />
                  {engine.rightPanelModules.map((m, idx) => (
                    <ModuleRenderer key={m} moduleType={m} idx={idx} engine={engine} bare />
                  ))}
                </div>
              )}
            </div>
          </aside>
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
