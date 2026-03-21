import { Schema, Types, type InferSchemaType } from "mongoose";
import { getModel } from "@/src/models/_shared";

const toolCallSchema = new Schema(
  {
    name: { type: String, required: true },
    input: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false },
);

const toolResultSchema = new Schema(
  {
    name: { type: String, required: true },
    status: { type: String, required: true },
    output: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false },
);

const messageSchema = new Schema(
  {
    sessionId: { type: Types.ObjectId, required: true, ref: "Session", index: true },
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: { type: String, required: true },
    toolCalls: { type: [toolCallSchema], default: undefined },
    toolResults: { type: [toolResultSchema], default: undefined },
  },
  {
    collection: "messages",
    timestamps: true,
  },
);

export type MessageModelDocument = InferSchemaType<typeof messageSchema>;
export const MessageModel = getModel("Message", messageSchema);
