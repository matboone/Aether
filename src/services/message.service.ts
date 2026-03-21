import { Types } from "mongoose";
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
    return MessageModel.create({
      sessionId: new Types.ObjectId(input.sessionId),
      role: input.role,
      content: input.content,
      toolCalls: input.toolCalls,
      toolResults: input.toolResults,
    });
  },

  async listMessages(sessionId: string) {
    return MessageModel.find({ sessionId: new Types.ObjectId(sessionId) })
      .sort({ createdAt: 1 })
      .lean();
  },
};
