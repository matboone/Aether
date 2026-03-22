"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Message, ModuleType } from "@/app/_types/dashboard";
import type { ChatEngine } from "@/app/_hooks/use-chat-engine";
import { ModuleRenderer } from "./modules/module-renderer";

/* Right-side module types that render in the strategy panel, not inline */
const RIGHT_PANEL_MODULES: Set<ModuleType> = new Set([
  "action-plan",
  "doc-chips",
  "phone-script",
]);

/* Inline modules should keep their first owner message to avoid remount/regeneration */
const STICKY_INLINE_MODULES: Set<ModuleType> = new Set([
  "upload",
  "bill-summary",
  "line-items",
  "income-selector",
  "eligibility",
  "action-plan",
  "phone-script",
  "doc-chips",
  "resolution",
]);

const INCOME_MODULE_DELAY_MS = 700;

interface ChatThreadProps {
  readonly messages: Message[];
  readonly isTyping: boolean;
  readonly threadRef: React.RefObject<HTMLDivElement | null>;
  readonly engine: ChatEngine;
}

export function ChatThread({ messages, isTyping, threadRef, engine }: ChatThreadProps) {
  const [incomeModuleReadyIds, setIncomeModuleReadyIds] = useState<Set<string>>(new Set());
  const incomeTimersRef = useRef<Map<string, ReturnType<typeof globalThis.setTimeout>>>(new Map());

  useEffect(() => {
    return () => {
      for (const timerId of incomeTimersRef.current.values()) {
        globalThis.clearTimeout(timerId);
      }
      incomeTimersRef.current.clear();
    };
  }, []);

  /*
   * Deduplicate modules: for each ModuleType, keep a single owner message
   * so modules do not remount or repeat across later assistant replies.
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
          const timerId = globalThis.setTimeout(() => {
            setIncomeModuleReadyIds((prev) => new Set(prev).add(msg.id));
            incomeTimersRef.current.delete(msg.id);
          }, waitMs);
          incomeTimersRef.current.set(msg.id, timerId);
        }
      }
    }
  }, [allowedModulesPerMsg, incomeModuleReadyIds, messages]);

  return (
    <div className="aether-chat__thread" ref={threadRef}>
      {messages.map((msg) => {
        const allModulesForMsg = allowedModulesPerMsg.get(msg.id) ?? [];
        const modulesForMsg =
          msg.id === engine.moduleRevealMessageId
            ? allModulesForMsg.slice(0, Math.max(0, engine.moduleRevealCount))
            : allModulesForMsg;
        const delayIncomeModule =
          allModulesForMsg.includes("income-selector") &&
          !incomeModuleReadyIds.has(msg.id);
        const visibleModules = delayIncomeModule ? [] : modulesForMsg;
        const hasText = msg.text.trim().length > 0;
        return (
          <div
            key={msg.id}
            id={`aether-msg-${msg.id}`}
            className={`msg-wrapper msg-wrapper--${msg.sender}`}
          >
            {msg.sender === "ai" && <div className="msg-avatar">A</div>}
            <div>
              {hasText && (
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
