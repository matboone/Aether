import { Types } from "mongoose";
import { ApiError } from "@/src/lib/api";
import { SessionModel } from "@/src/models/session.model";
import type { SessionFacts, SessionStep } from "@/src/types/domain";

export const sessionService = {
  async createSession() {
    return SessionModel.create({
      step: "NEW" satisfies SessionStep,
      facts: {} satisfies SessionFacts,
    });
  },

  async getSessionById(sessionId: string) {
    const session = await SessionModel.findById(sessionId);
    if (!session) {
      throw new ApiError("SESSION_NOT_FOUND", "Session not found", 404);
    }
    return session;
  },

  async updateStep(sessionId: string, step: SessionStep) {
    const session = await SessionModel.findByIdAndUpdate(
      sessionId,
      { $set: { step } },
      { new: true },
    );

    if (!session) {
      throw new ApiError("SESSION_NOT_FOUND", "Session not found", 404);
    }

    return session;
  },

  async patchFacts(sessionId: string, patch: Partial<SessionFacts>) {
    const session = await SessionModel.findById(sessionId);
    if (!session) {
      throw new ApiError("SESSION_NOT_FOUND", "Session not found", 404);
    }

    session.facts = {
      ...session.facts,
      ...patch,
    };

    await session.save();
    return session;
  },

  async setStepAndFacts(
    sessionId: string,
    step: SessionStep,
    factsPatch: Partial<SessionFacts>,
  ) {
    const session = await SessionModel.findById(sessionId);
    if (!session) {
      throw new ApiError("SESSION_NOT_FOUND", "Session not found", 404);
    }

    session.step = step;
    session.facts = {
      ...session.facts,
      ...factsPatch,
    };

    await session.save();
    return session;
  },

  toObjectId(id: string) {
    return new Types.ObjectId(id);
  },
};
