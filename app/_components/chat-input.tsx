"use client";

import React from "react";
import { Paperclip, ArrowRight } from "lucide-react";
import type { Stage } from "@/app/_types/dashboard";
import { SUGGESTION_CHIPS } from "@/app/_constants/dashboard";

interface ChatInputProps {
  readonly stage: Stage;
  readonly inputValue: string;
  readonly textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  readonly onChipClick: (text: string) => void;
  readonly onSend: () => void;
  readonly onTextareaChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  readonly onKeyDown: (e: React.KeyboardEvent) => void;
}

export function ChatInput({
  stage,
  inputValue,
  textareaRef,
  onChipClick,
  onSend,
  onTextareaChange,
  onKeyDown,
}: ChatInputProps) {
  const chips = SUGGESTION_CHIPS[stage] ?? [];

  return (
    <div className="aether-input-bar">
      {chips.length > 0 && (
        <div className="suggestion-strip">
          {chips.map((chip, i) => (
            <button
              key={`${stage}-${i}`}
              className="suggestion-chip"
              style={{ animationDelay: `${i * 80}ms` }}
              onClick={() => onChipClick(chip)}
            >
              {chip}
            </button>
          ))}
        </div>
      )}
      <div className="input-container">
        <button className="input-icon-btn" title="Attach file">
          <Paperclip size={16} />
        </button>
        <textarea
          ref={textareaRef}
          className="input-textarea"
          placeholder="Describe your situation or ask a question\u2026"
          rows={1}
          value={inputValue}
          onChange={onTextareaChange}
          onKeyDown={onKeyDown}
        />
        <button
          className={`input-icon-btn send-btn ${inputValue.trim() ? "" : "send-btn--disabled"}`}
          onClick={() => onSend()}
          title="Send"
        >
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
