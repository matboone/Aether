"use client";

import React from "react";
import type { Message } from "@/app/_types/dashboard";
import type { ChatEngine } from "@/app/_hooks/use-chat-engine";
import { ModuleRenderer } from "./modules/module-renderer";

interface ChatThreadProps {
  readonly messages: Message[];
  readonly isTyping: boolean;
  readonly threadRef: React.RefObject<HTMLDivElement | null>;
  readonly engine: ChatEngine;
}

export function ChatThread({ messages, isTyping, threadRef, engine }: ChatThreadProps) {
  return (
    <div className="aether-chat__thread" ref={threadRef}>
      {messages.map((msg) => (
        <div key={msg.id} className={`msg-wrapper msg-wrapper--${msg.sender}`}>
          {msg.sender === "ai" && <div className="msg-avatar">A</div>}
          <div>
            <div className={`msg-bubble msg-bubble--${msg.sender}`}>
              {msg.sender === "ai" && <div className="msg-sender">Aether</div>}
              <div className="msg-text">{msg.text}</div>
            </div>
            {msg.modules?.map((m, idx) => (
              <ModuleRenderer
                key={m}
                moduleType={m}
                idx={idx}
                engine={engine}
              />
            ))}
          </div>
        </div>
      ))}

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
