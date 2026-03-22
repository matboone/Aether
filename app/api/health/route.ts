import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { connectToDatabase } from "@/src/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const status: {
    db: "ok" | "error";
    dbDetail?: string;
    ai: "ok" | "error";
    aiDetail?: string;
    timestamp: string;
  } = {
    db: "error",
    ai: "error",
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

  try {
    const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
    const { text } = await generateText({
      model: google(model),
      maxRetries: 1,
      prompt: "Reply with exactly: OK",
      maxTokens: 5,
    });
    if (text.trim().length > 0) {
      status.ai = "ok";
    } else {
      status.aiDetail = "Empty response from Gemini";
    }
  } catch (error) {
    status.aiDetail = error instanceof Error ? error.message : "Unknown AI error";
  }

  const healthy = status.db === "ok" && status.ai === "ok";
  return NextResponse.json(status, { status: healthy ? 200 : 503 });
}
