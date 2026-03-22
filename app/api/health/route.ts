import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { connectToDatabase } from "@/src/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Cached result of the last AI connectivity check. */
interface AiCheckCache {
  status: "ok" | "error";
  detail?: string;
  expiresAt: number;
}

let aiCheckCache: AiCheckCache | null = null;
const AI_CACHE_TTL_MS = 60_000; // 60 seconds

async function checkAi(): Promise<{ status: "ok" | "error"; detail?: string }> {
  const now = Date.now();

  if (aiCheckCache && now < aiCheckCache.expiresAt) {
    return { status: aiCheckCache.status, detail: aiCheckCache.detail };
  }

  let result: { status: "ok" | "error"; detail?: string };

  try {
    const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
    const { text } = await generateText({
      model: google(model),
      maxRetries: 1,
      prompt: "Reply with exactly: OK",
      maxTokens: 5,
    });
    if (text.trim().length > 0) {
      result = { status: "ok" };
    } else {
      result = { status: "error", detail: "Empty response from Gemini" };
    }
  } catch (error) {
    result = {
      status: "error",
      detail: error instanceof Error ? error.message : "Unknown AI error",
    };
  }

  aiCheckCache = { ...result, expiresAt: now + AI_CACHE_TTL_MS };
  return result;
}

export async function GET() {
  const aiCheckEnabled = process.env.HEALTH_AI_CHECK === "true";

  const status: {
    db: "ok" | "error";
    dbDetail?: string;
    ai: "ok" | "error" | "skipped";
    aiDetail?: string;
    timestamp: string;
  } = {
    db: "error",
    ai: aiCheckEnabled ? "error" : "skipped",
    timestamp: new Date().toISOString(),
  };

  try {
    const conn = await connectToDatabase();
    await conn.connection.db?.admin().ping();
    status.db = "ok";
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown DB error";
    if (msg.includes("IP") || msg.includes("whitelist") || msg.includes("Atlas cluster")) {
      status.dbDetail = "MongoDB Atlas rejected the connection. Ensure your current IP is in the Atlas Network Access allowlist.";
    } else if (msg.includes("SSL") || msg.includes("tls") || msg.includes("ssl")) {
      status.dbDetail = "TLS handshake failed. This often means your IP is not allowlisted in MongoDB Atlas.";
    } else {
      status.dbDetail = msg;
    }
  }

  if (aiCheckEnabled) {
    const aiResult = await checkAi();
    status.ai = aiResult.status;
    if (aiResult.detail) {
      status.aiDetail = aiResult.detail;
    }
  }

  const healthy = status.db === "ok" && (status.ai === "ok" || status.ai === "skipped");
  return NextResponse.json(status, { status: healthy ? 200 : 503 });
}
