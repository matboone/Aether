import { Types } from "mongoose";
import { logInfo, summarizeText } from "@/src/lib/logger";
import { MessageModel } from "@/src/models/message.model";
import type {
  MessageRole,
  MessageToolCall,
  MessageToolResult,
} from "@/src/types/domain";

export const messageService = {
  async createMessage(input: {
    sessionId: string;
    role: MessageRole;
    content: string;
    toolCalls?: MessageToolCall[];
    toolResults?: MessageToolResult[];
  }) {
    const message = await MessageModel.create({
      sessionId: new Types.ObjectId(input.sessionId),
      role: input.role,
      content: input.content,
      toolCalls: input.toolCalls,
      toolResults: input.toolResults,
    });

    logInfo("message.service", "message.created", {
      sessionId: input.sessionId,
      messageId: message._id.toString(),
      role: input.role,
      contentPreview: summarizeText(input.content),
      toolCallCount: input.toolCalls?.length ?? 0,
      toolResultCount: input.toolResults?.length ?? 0,
    });

    return message;
  },

  async listMessages(sessionId: string) {
    const messages = await MessageModel.find({ sessionId: new Types.ObjectId(sessionId) })
      .sort({ createdAt: 1 })
      .lean();

    logInfo("message.service", "messages.listed", {
      sessionId,
      count: messages.length,
    });

    return messages;
  },
};
