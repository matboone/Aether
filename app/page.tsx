"use client";

import "./dashboard.css";
import { useChatEngine } from "./_hooks/use-chat-engine";
import { STAGE_LABELS } from "./_constants/dashboard";
import { Sidebar } from "./_components/sidebar";
import { ChatThread } from "./_components/chat-thread";
import { ChatInput } from "./_components/chat-input";
import { SessionFactsPanel } from "./_components/session-facts";

export default function AetherDashboard() {
  const engine = useChatEngine();
  const showWelcome = !engine.hasStarted;

  return (
    <div className="aether-dashboard">
      {/* ─── Left Sidebar ─── */}
      <Sidebar
        activeNav={engine.activeNav}
        onNavChange={engine.setActiveNav}
      />

      {/* ─── Chat Panel ─── */}
      <main className={`aether-chat ${showWelcome ? "aether-chat--welcome" : ""}`}>
        {showWelcome ? (
          <>
            {/* ─── Centered Welcome Hero ─── */}
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

            {/* ─── Input (centered, inline) ─── */}
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

            {/* ─── Feature cards ─── */}
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

      {/* ─── Session Facts Panel ─── */}
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
    </div>
  );
}
