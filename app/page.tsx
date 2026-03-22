"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
import type { ModuleType, SessionFacts } from "./_types/dashboard";

type RightTab = "info" | "strategy";

const RIGHT_PANEL_MODULES: Set<ModuleType> = new Set([
  "action-plan",
  "doc-chips",
  "phone-script",
]);

export default function AetherDashboard() {
  const engine = useChatEngine();
  const showWelcome = !engine.hasStarted;
  const inputBusy = engine.isTyping || engine.isUploading || engine.loadingStepNumber !== null;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [rightTab, setRightTab] = useState<RightTab>("info");
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelPrimed, setPanelPrimed] = useState(false);
  const autoOpenTriggeredRef = useRef(false);

  const eligibilityCompleted =
    engine.facts.assistanceEligible === "likely" ||
    engine.facts.assistanceEligible === "unlikely";

  const strategyModules = useMemo(
    () =>
      engine.rightPanelModules.filter((m) =>
        eligibilityCompleted ? true : m !== "action-plan" && m !== "phone-script",
      ),
    [eligibilityCompleted, engine.rightPanelModules],
  );

  const revealedInlineModules = useMemo<ModuleType[]>(() => {
    if (!engine.moduleRevealMessageId) return [];
    const msg = engine.messages.find((m) => m.id === engine.moduleRevealMessageId);
    if (!msg?.modules?.length) return [];
    return msg.modules
      .filter((m): m is ModuleType => !RIGHT_PANEL_MODULES.has(m))
      .slice(0, Math.max(0, engine.moduleRevealCount));
  }, [engine.messages, engine.moduleRevealCount, engine.moduleRevealMessageId]);

  const factsForPanel = useMemo<SessionFacts>(() => {
    const visible = new Set<ModuleType>(revealedInlineModules);
    const billVisible = visible.has("bill-summary") || visible.has("line-items") || visible.has("upload");
    const eligibilityVisible = visible.has("eligibility") || visible.has("income-selector");
    const resolutionVisible = visible.has("resolution");

    return {
      ...engine.facts,
      estimatedBillTotal: billVisible ? engine.facts.estimatedBillTotal : null,
      uploadedBillId: billVisible ? engine.facts.uploadedBillId : null,
      parsedBillId: billVisible ? engine.facts.parsedBillId : null,
      analysisId: billVisible ? engine.facts.analysisId : null,
      incomeBracket: eligibilityVisible ? engine.facts.incomeBracket : null,
      householdSize: eligibilityVisible ? engine.facts.householdSize : null,
      assistanceEligible: eligibilityVisible ? engine.facts.assistanceEligible : null,
      negotiationOutcome: resolutionVisible ? engine.facts.negotiationOutcome : null,
    };
  }, [engine.facts, revealedInlineModules]);

  useEffect(() => {
    if (!engine.hasStarted) {
      autoOpenTriggeredRef.current = false;
      setPanelPrimed(false);
      setPanelOpen(false);
      return;
    }
    if (autoOpenTriggeredRef.current) return;
    autoOpenTriggeredRef.current = true;
    let primedTimer: number | null = null;
    const autoOpenTimer = window.setTimeout(() => {
      setPanelOpen(true);
      primedTimer = window.setTimeout(() => {
        setPanelPrimed(true);
      }, 360);
    }, 1000);
    return () => {
      window.clearTimeout(autoOpenTimer);
      if (primedTimer !== null) {
        window.clearTimeout(primedTimer);
      }
    };
  }, [engine.hasStarted]);

  useEffect(() => {
    if (engine.uploaded || engine.facts.uploadedBillId) {
      if (panelPrimed) {
        setPanelOpen(true);
      }
    }
  }, [engine.uploaded, engine.facts.uploadedBillId, panelPrimed]);

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
                isBusy={inputBusy}
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

              <button
                className="aether-chat__panel-toggle"
                onClick={() => setPanelOpen((p) => !p)}
                aria-label={panelOpen ? "Hide side panel" : "Show side panel"}
                disabled={!panelPrimed}
              >
                {panelOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
              </button>
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
              isBusy={inputBusy}
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
      {!showWelcome && (
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
                <div className="right-panel__info-wrap">
                  <SessionFactsPanel
                    facts={factsForPanel}
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
                </div>
              )}

              {rightTab === "strategy" && (
                <div className="right-panel__strategy-body">
                  <StrategyChecklistPlaceholder stage={engine.stage} isLoading={engine.isTyping || engine.isUploading} />
                  {strategyModules.map((m, idx) => (
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
