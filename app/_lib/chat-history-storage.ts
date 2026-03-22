export type ChatHistoryNode = {
  sessionId: string;
  title: string;
  updatedAt: number;
};

const STORAGE_KEY = "aether-chat-nodes-v1";
const MAX_NODES = 32;

export function loadChatNodes(): ChatHistoryNode[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (n): n is ChatHistoryNode =>
          typeof n === "object" &&
          n !== null &&
          typeof (n as ChatHistoryNode).sessionId === "string" &&
          typeof (n as ChatHistoryNode).title === "string" &&
          typeof (n as ChatHistoryNode).updatedAt === "number",
      )
      .slice(0, MAX_NODES);
  } catch {
    return [];
  }
}

export function persistChatNodes(nodes: ChatHistoryNode[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes.slice(0, MAX_NODES)));
  } catch {
    /* ignore quota */
  }
}

/** Insert or update by sessionId (most recent first). */
export function upsertChatNode(node: ChatHistoryNode): ChatHistoryNode[] {
  const prev = loadChatNodes();
  const without = prev.filter((n) => n.sessionId !== node.sessionId);
  const next = [{ ...node, updatedAt: node.updatedAt }, ...without].slice(0, MAX_NODES);
  persistChatNodes(next);
  return next;
}
