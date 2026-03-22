"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import "./dashboard.css";
import { useChatEngine } from "./_hooks/use-chat-engine";
import { Sidebar } from "./_components/sidebar";
import { ChatThread } from "./_components/chat-thread";
import { ChatInput } from "./_components/chat-input";
import { SessionFactsPanel } from "./_components/session-facts";
import { SettingsDialog } from "./_components/settings-dialog";
import { useTheme } from "./_hooks/use-theme";
import { ModuleRenderer } from "./_components/modules/module-renderer";
import { ChatHistoryRail } from "./_components/chat-history-rail";
import { ArrowLeft, FileText, Lightbulb, Phone, PanelRightClose, PanelRightOpen } from "lucide-react";
import { CaduceusIcon } from "./_components/caduceus-icon";
import type { ModuleType } from "./_types/dashboard";

type RightTab = "info" | "strategy";

type DashboardPreferences = {
  compactDensity: boolean;
  reduceMotion: boolean;
  autoOpenPanel: boolean;
  fastModuleReveal: boolean;
  rememberRightTab: boolean;
};

const DASHBOARD_PREFERENCES_KEY = "aether-dashboard-preferences";
const DASHBOARD_LAST_TAB_KEY = "aether-dashboard-last-tab";

const DEFAULT_PREFERENCES: DashboardPreferences = {
  compactDensity: false,
  reduceMotion: false,
  autoOpenPanel: true,
  fastModuleReveal: false,
  rememberRightTab: true,
};

const RIGHT_PANEL_MODULES: Set<ModuleType> = new Set([
  "eligibility",
  "action-plan",
  "doc-chips",
  "phone-script",
]);

const STRATEGY_PIPELINE_ORDER: ModuleType[] = [
  "eligibility",
  "action-plan",
  "phone-script",
  "doc-chips",
];

function isStrategyModuleComplete(moduleType: ModuleType, engine: ReturnType<typeof useChatEngine>): boolean {
  switch (moduleType) {
    case "eligibility":
      return (
        engine.facts.assistanceEligible === "likely" ||
        engine.facts.assistanceEligible === "unlikely" ||
        Boolean(engine.backendUi?.negotiationPlan?.assistanceAssessment)
      );
    case "action-plan":
      return (engine.backendUi?.negotiationPlan?.nextActions?.length ?? 0) > 0;
    case "phone-script":
      return (engine.backendUi?.negotiationPlan?.phoneScript?.length ?? 0) > 0;
    case "doc-chips":
      return (
        (engine.backendUi?.negotiationPlan?.nextActions?.length ?? 0) > 0 &&
        (engine.backendUi?.negotiationPlan?.phoneScript?.length ?? 0) > 0
      );
    default:
      return false;
  }
}

export default function AetherDashboard() {
  const [preferences, setPreferences] = useState<DashboardPreferences>(DEFAULT_PREFERENCES);
  const engine = useChatEngine({ fastModuleReveal: preferences.fastModuleReveal });
  const { isDark, toggle: toggleDark } = useTheme();
  const showWelcome = !engine.hasStarted;
  const inputBusy = engine.isTyping || engine.isUploading || engine.loadingStepNumber !== null;
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [rightTab, setRightTab] = useState<RightTab>("info");
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelPrimed, setPanelPrimed] = useState(false);
  const [strategyRevealCount, setStrategyRevealCount] = useState(0);
  const autoOpenTriggeredRef = useRef(false);
  const strategyTabAutoOpenedRef = useRef(false);

  const setPreference = useCallback(<K extends keyof DashboardPreferences>(key: K, value: DashboardPreferences[K]) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DASHBOARD_PREFERENCES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<DashboardPreferences>;
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
        if (parsed.rememberRightTab ?? DEFAULT_PREFERENCES.rememberRightTab) {
          const savedTab = localStorage.getItem(DASHBOARD_LAST_TAB_KEY);
          if (savedTab === "info" || savedTab === "strategy") {
            setRightTab(savedTab);
          }
        }
      }
    } catch {
      setPreferences(DEFAULT_PREFERENCES);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DASHBOARD_PREFERENCES_KEY, JSON.stringify(preferences));
    } catch {
      // Ignore persistence failures (private mode, blocked storage, etc.)
    }
  }, [preferences]);

  useEffect(() => {
    if (!preferences.rememberRightTab) {
      try {
        localStorage.removeItem(DASHBOARD_LAST_TAB_KEY);
      } catch {
        // ignore
      }
      return;
    }
    try {
      localStorage.setItem(DASHBOARD_LAST_TAB_KEY, rightTab);
    } catch {
      // ignore
    }
  }, [preferences.rememberRightTab, rightTab]);

  const factsForPanel = engine.facts;
  const availableStrategyModules = useMemo(
    () => STRATEGY_PIPELINE_ORDER.filter((m) => engine.rightPanelModules.includes(m)),
    [engine.rightPanelModules],
  );

  useEffect(() => {
    if (availableStrategyModules.length === 0) {
      setStrategyRevealCount(0);
      return;
    }
    setStrategyRevealCount((prev) => Math.max(prev, 1));
  }, [availableStrategyModules.length]);

  useEffect(() => {
    if (availableStrategyModules.length === 0 || strategyRevealCount === 0) return;
    if (strategyRevealCount >= availableStrategyModules.length) return;
    const currentModule = availableStrategyModules[strategyRevealCount - 1];
    if (!isStrategyModuleComplete(currentModule, engine)) return;

    const timer = globalThis.setTimeout(() => {
      setStrategyRevealCount((prev) => {
        if (prev >= availableStrategyModules.length) return prev;
        return prev + 1;
      });
    }, 240);

    return () => {
      globalThis.clearTimeout(timer);
    };
  }, [availableStrategyModules, engine, strategyRevealCount]);

  const visibleStrategyModules = useMemo(
    () => availableStrategyModules.slice(0, Math.max(0, strategyRevealCount)),
    [availableStrategyModules, strategyRevealCount],
  );

  useEffect(() => {
    if (!engine.hasStarted) {
      autoOpenTriggeredRef.current = false;
      strategyTabAutoOpenedRef.current = false;
      setPanelPrimed(false);
      setPanelOpen(false);
      return;
    }
    if (!preferences.autoOpenPanel) {
      setPanelPrimed(true);
      return;
    }
    if (autoOpenTriggeredRef.current) return;
    autoOpenTriggeredRef.current = true;
    let primedTimer: number | null = null;
    const autoOpenTimer = globalThis.setTimeout(() => {
      setPanelOpen(true);
      primedTimer = globalThis.setTimeout(() => {
        setPanelPrimed(true);
      }, 360);
    }, 1000);
    return () => {
      globalThis.clearTimeout(autoOpenTimer);
      if (primedTimer !== null) {
        globalThis.clearTimeout(primedTimer);
      }
    };
  }, [engine.hasStarted, preferences.autoOpenPanel]);

  useEffect(() => {
    if (availableStrategyModules.length === 0) return;
    if (strategyTabAutoOpenedRef.current) return;
    strategyTabAutoOpenedRef.current = true;
    setPanelOpen(true);
    setRightTab("strategy");
  }, [availableStrategyModules.length]);

  useEffect(() => {
    if (!preferences.autoOpenPanel) return;
    if (engine.uploaded || engine.facts.uploadedBillId) {
      if (panelPrimed) {
        setPanelOpen(true);
      }
    }
  }, [engine.uploaded, engine.facts.uploadedBillId, panelPrimed, preferences.autoOpenPanel]);

  return (
    <div
      className={`aether-dashboard${
        !showWelcome && panelOpen ? " aether-dashboard--panel-open" : ""
      }${preferences.compactDensity ? " aether-dashboard--compact" : ""}${preferences.reduceMotion ? " aether-dashboard--reduce-motion" : ""}`}
    >
      {/* ─── Left Sidebar ─── */}
      <Sidebar
        activeNav={engine.activeNav}
        onNavChange={engine.setActiveNav}
        onOpenSettings={() => setSettingsOpen(true)}
        profileName={engine.profile.accountName}
        profileStatus={engine.profile.status}
      />

      <div
        className={`chat-history-rail-outer${
          engine.activeNav === 1 ? "" : " chat-history-rail-outer--hidden"
        }`}
        aria-hidden={engine.activeNav !== 1}
      >
        <ChatHistoryRail
          nodes={engine.chatNodes}
          activeSessionId={engine.sessionId}
          isLoading={engine.isLoadingChatSession}
          onSelectSession={engine.loadChatSession}
        />
      </div>

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
                    stage={engine.stage}
                    isLoading={engine.isTyping || engine.isUploading || engine.loadingStepNumber !== null}
                    incomeConfirmed={engine.incomeConfirmed}
                    hasStrategyPlan={Boolean(engine.backendUi?.negotiationPlan)}
                    hasPhoneScript={Boolean((engine.backendUi?.negotiationPlan?.phoneScript?.length ?? 0) > 0)}
                    openSections={engine.openSections}
                    techIdsOpen={engine.techIdsOpen}
                    onToggleSection={(key) =>
                      engine.setOpenSections((prev) => ({
                        ...prev,
                        [key]: !prev[key],
                      }))
                    }
                    onToggleTechIds={() => engine.setTechIdsOpen(!engine.techIdsOpen)}
                    onClearSession={engine.clearSession}
                  />
                </div>
              )}

              {rightTab === "strategy" && (
                <div className="right-panel__strategy-body">
                  {visibleStrategyModules.map((m, idx) => (
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
        isDark={isDark}
        onToggleDark={toggleDark}
        preferences={preferences}
        onSetPreference={setPreference}
      />
    </div>
  );
}
