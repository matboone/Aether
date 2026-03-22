"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Message, ModuleType } from "@/app/_types/dashboard";
import type { ChatEngine } from "@/app/_hooks/use-chat-engine";
import { ModuleRenderer } from "./modules/module-renderer";

/* Right-side module types that render in the strategy panel, not inline */
const RIGHT_PANEL_MODULES: Set<ModuleType> = new Set([
  "action-plan",
  "phone-script",
]);

/* Sticky inline modules should keep their first owner message to avoid remount/regeneration */
const STICKY_INLINE_MODULES: Set<ModuleType> = new Set([
  "bill-summary",
  "line-items",
]);

const ELIGIBILITY_LOAD_MS = 2900;
const BRACKET_BUBBLE_EXTRA_DELAY_MS = 600;
const INCOME_MODULE_DELAY_MS = 700;

interface ChatThreadProps {
  readonly messages: Message[];
  readonly isTyping: boolean;
  readonly threadRef: React.RefObject<HTMLDivElement | null>;
  readonly engine: ChatEngine;
}

export function ChatThread({ messages, isTyping, threadRef, engine }: ChatThreadProps) {
  const [bracketBubbleReadyIds, setBracketBubbleReadyIds] = useState<Set<string>>(new Set());
  const [incomeModuleReadyIds, setIncomeModuleReadyIds] = useState<Set<string>>(new Set());
  const bracketTimersRef = useRef<Map<string, number>>(new Map());
  const incomeTimersRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    return () => {
      for (const timerId of bracketTimersRef.current.values()) {
        window.clearTimeout(timerId);
      }
      for (const timerId of incomeTimersRef.current.values()) {
        window.clearTimeout(timerId);
      }
      bracketTimersRef.current.clear();
      incomeTimersRef.current.clear();
    };
  }, []);

  /*
   * Deduplicate modules: for each ModuleType, only the LAST message
   * that declares it actually renders it. This prevents duplicate
   * upload prompts, etc.
   */
  const allowedModulesPerMsg = useMemo(() => {
    const owner = new Map<ModuleType, string>();
    for (const msg of messages) {
      for (const m of msg.modules ?? []) {
        if (STICKY_INLINE_MODULES.has(m) && owner.has(m)) {
          continue;
        }
        owner.set(m, msg.id);
      }
    }
    const result = new Map<string, ModuleType[]>();
    for (const msg of messages) {
      const kept = (msg.modules ?? []).filter(
        (m) => owner.get(m) === msg.id && !RIGHT_PANEL_MODULES.has(m),
      );
      if (kept.length > 0) result.set(msg.id, kept);
    }
    return result;
  }, [messages]);

  useEffect(() => {
    for (const msg of messages) {
      const allModulesForMsg = allowedModulesPerMsg.get(msg.id) ?? [];
      const createdAt = Number(msg.id.split("-")[1] ?? 0);
      const elapsed = Number.isFinite(createdAt) && createdAt > 0 ? Date.now() - createdAt : 0;

      const bracketMessageNeedsDelay =
        msg.sender === "ai" &&
        /based on this bracket/i.test(msg.text) &&
        allModulesForMsg.includes("eligibility");
      if (
        bracketMessageNeedsDelay &&
        !bracketBubbleReadyIds.has(msg.id) &&
        !bracketTimersRef.current.has(msg.id)
      ) {
        const waitMs = Math.max(0, ELIGIBILITY_LOAD_MS + BRACKET_BUBBLE_EXTRA_DELAY_MS - elapsed);
        if (waitMs <= 0) {
          setBracketBubbleReadyIds((prev) => new Set(prev).add(msg.id));
        } else {
          const timerId = window.setTimeout(() => {
            setBracketBubbleReadyIds((prev) => new Set(prev).add(msg.id));
            bracketTimersRef.current.delete(msg.id);
          }, waitMs);
          bracketTimersRef.current.set(msg.id, timerId);
        }
      }

      const incomeModuleNeedsDelay = allModulesForMsg.includes("income-selector");
      if (
        incomeModuleNeedsDelay &&
        !incomeModuleReadyIds.has(msg.id) &&
        !incomeTimersRef.current.has(msg.id)
      ) {
        const waitMs = Math.max(0, INCOME_MODULE_DELAY_MS - elapsed);
        if (waitMs <= 0) {
          setIncomeModuleReadyIds((prev) => new Set(prev).add(msg.id));
        } else {
          const timerId = window.setTimeout(() => {
            setIncomeModuleReadyIds((prev) => new Set(prev).add(msg.id));
            incomeTimersRef.current.delete(msg.id);
          }, waitMs);
          incomeTimersRef.current.set(msg.id, timerId);
        }
      }
    }
  }, [allowedModulesPerMsg, bracketBubbleReadyIds, incomeModuleReadyIds, messages]);

  return (
    <div className="aether-chat__thread" ref={threadRef}>
      {messages.map((msg) => {
        const allModulesForMsg = allowedModulesPerMsg.get(msg.id) ?? [];
        const modulesForMsg =
          msg.id === engine.moduleRevealMessageId
            ? allModulesForMsg.slice(0, Math.max(0, engine.moduleRevealCount))
            : allModulesForMsg;
        const delayBracketBubble =
          msg.sender === "ai" &&
          /based on this bracket/i.test(msg.text) &&
          allModulesForMsg.includes("eligibility") &&
          !bracketBubbleReadyIds.has(msg.id);
        const delayIncomeModule =
          allModulesForMsg.includes("income-selector") &&
          !incomeModuleReadyIds.has(msg.id);
        /* Only defer the income block — hiding all modules made bill summary unusable */
        const visibleModules = modulesForMsg.filter((m) => {
          if (m !== "income-selector") return true;
          return !delayIncomeModule;
        });
        const hasText = msg.text.trim().length > 0;
        return (
          <div key={msg.id} className={`msg-wrapper msg-wrapper--${msg.sender}`}>
            {msg.sender === "ai" && <div className="msg-avatar">A</div>}
            <div>
              {hasText && !delayBracketBubble && (
                <div
                  className={`msg-bubble msg-bubble--${msg.sender}`}
                >
                  {msg.sender === "ai" && <div className="msg-sender">Aether</div>}
                  <div className="msg-text">{msg.text}</div>
                </div>
              )}
              {visibleModules.length > 0 && (
                <div className="msg-modules">
                  {visibleModules.map((m, idx) => (
                    <div key={`${msg.id}-${m}-${idx}`} className="msg-module-slot">
                      <ModuleRenderer
                        moduleType={m}
                        idx={idx}
                        engine={engine}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {isTyping && (
        <div className="msg-wrapper msg-wrapper--ai">
          <div className="msg-avatar">A</div>
          <div className="typing-indicator">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        </div>
      )}
    </div>
  );
}
