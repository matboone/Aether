"use client";

import type { ChatHistoryNode } from "@/app/_lib/chat-history-storage";

function formatNodeWhen(ts: number): string {
  try {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

interface ChatHistoryRailProps {
  readonly nodes: ChatHistoryNode[];
  readonly activeSessionId: string | null;
  readonly isLoading: boolean;
  readonly onSelectSession: (sessionId: string) => void;
}

export function ChatHistoryRail({
  nodes,
  activeSessionId,
  isLoading,
  onSelectSession,
}: ChatHistoryRailProps) {
  return (
    <aside
      className={`chat-history-rail${isLoading ? " chat-history-rail--loading" : ""}`}
      aria-label="Chat history"
    >
      <div className="chat-history-rail__header">
        <h2 className="chat-history-rail__title">Conversations</h2>
        <p className="chat-history-rail__sub">Past sessions</p>
      </div>
      <div className="chat-history-rail__list" role="list">
        {nodes.length === 0 ? (
          <p className="chat-history-rail__empty">
            When you return home from a chat, it appears here. Open one to continue where you left off.
          </p>
        ) : (
          nodes.map((node) => {
            const active = node.sessionId === activeSessionId;
            return (
              <button
                key={node.sessionId}
                type="button"
                role="listitem"
                className={`chat-history-rail__node${active ? " chat-history-rail__node--active" : ""}`}
                onClick={() => onSelectSession(node.sessionId)}
                disabled={isLoading}
              >
                <span className="chat-history-rail__node-title" title={node.title}>
                  {node.title}
                </span>
                <span className="chat-history-rail__node-when">{formatNodeWhen(node.updatedAt)}</span>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
