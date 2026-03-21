"use client";

import React, { useMemo } from "react";
import type { Message, ModuleType } from "@/app/_types/dashboard";
import type { ChatEngine } from "@/app/_hooks/use-chat-engine";
import { ModuleRenderer } from "./modules/module-renderer";

/* Right-side module types that render in the strategy panel, not inline */
const RIGHT_PANEL_MODULES: Set<ModuleType> = new Set([
  "action-plan",
  "doc-chips",
  "phone-script",
]);

interface ChatThreadProps {
  readonly messages: Message[];
  readonly isTyping: boolean;
  readonly threadRef: React.RefObject<HTMLDivElement | null>;
  readonly engine: ChatEngine;
}

export function ChatThread({ messages, isTyping, threadRef, engine }: ChatThreadProps) {
  /*
   * Deduplicate modules: for each ModuleType, only the LAST message
   * that declares it actually renders it. This prevents duplicate
   * upload prompts, etc.
   */
  const allowedModulesPerMsg = useMemo(() => {
    const lastOwner = new Map<ModuleType, string>();
    for (const msg of messages) {
      for (const m of msg.modules ?? []) {
        lastOwner.set(m, msg.id);
      }
    }
    const result = new Map<string, ModuleType[]>();
    for (const msg of messages) {
      const kept = (msg.modules ?? []).filter(
        (m) => lastOwner.get(m) === msg.id && !RIGHT_PANEL_MODULES.has(m),
      );
      if (kept.length > 0) result.set(msg.id, kept);
    }
    return result;
  }, [messages]);

  return (
    <div className="aether-chat__thread" ref={threadRef}>
      {messages.map((msg) => {
        const modulesForMsg = allowedModulesPerMsg.get(msg.id) ?? [];
        return (
          <div key={msg.id} className={`msg-wrapper msg-wrapper--${msg.sender}`}>
            {msg.sender === "ai" && <div className="msg-avatar">A</div>}
            <div>
              <div className={`msg-bubble msg-bubble--${msg.sender}`}>
                {msg.sender === "ai" && <div className="msg-sender">Aether</div>}
                <div className="msg-text">{msg.text}</div>
              </div>
              {modulesForMsg.map((m, idx) => (
                <ModuleRenderer
                  key={m}
                  moduleType={m}
                  idx={idx}
                  engine={engine}
                />
              ))}
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
