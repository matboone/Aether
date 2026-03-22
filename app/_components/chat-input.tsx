"use client";

import React from "react";
import { Paperclip, ArrowRight } from "lucide-react";
import type { Stage } from "@/app/_types/dashboard";

interface ChatInputProps {
  readonly stage: Stage;
  readonly suggestions: string[];
  readonly inputValue: string;
  readonly textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  readonly onChipClick: (text: string) => void;
  readonly onAttachFile: (file: File) => void;
  readonly onSend: () => void;
  readonly onTextareaChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  readonly onKeyDown: (e: React.KeyboardEvent) => void;
}

export function ChatInput({
  stage,
  suggestions,
  inputValue,
  textareaRef,
  onChipClick,
  onAttachFile,
  onSend,
  onTextareaChange,
  onKeyDown,
}: ChatInputProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const chips = suggestions;

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
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          style={{ display: "none" }}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              onAttachFile(file);
            }
            event.currentTarget.value = "";
          }}
        />
        <button
          className="input-icon-btn"
          title="Attach PDF"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip size={16} />
        </button>
        <textarea
          ref={textareaRef}
          className="input-textarea"
          placeholder="Describe your situation or ask a question…"
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
