import { Types } from "mongoose";
import { ApiError } from "@/src/lib/api";
import {
  logInfo,
  summarizeSessionFacts,
  summarizeTransition,
} from "@/src/lib/logger";
import { SessionModel } from "@/src/models/session.model";
import type { SessionFacts, SessionStep } from "@/src/types/domain";

export const sessionService = {
  async createSession() {
    const session = await SessionModel.create({
      step: "NEW" satisfies SessionStep,
      facts: {} satisfies SessionFacts,
    });

    logInfo("session.service", "session.created", {
      sessionId: session._id.toString(),
      step: session.step,
    });

    return session;
  },

  async getSessionById(sessionId: string) {
    const session = await SessionModel.findById(sessionId);
    if (!session) {
      throw new ApiError("SESSION_NOT_FOUND", "Session not found", 404);
    }

    logInfo("session.service", "session.loaded", {
      sessionId,
      step: session.step,
      facts: summarizeSessionFacts(session.facts),
    });

    return session;
  },

  async updateStep(sessionId: string, step: SessionStep) {
    const session = await SessionModel.findById(sessionId);
    if (!session) {
      throw new ApiError("SESSION_NOT_FOUND", "Session not found", 404);
    }

    const previousStep = session.step;
    session.step = step;
    await session.save();

    logInfo("session.service", "session.step_updated", {
      sessionId,
      ...summarizeTransition(previousStep, step),
      facts: summarizeSessionFacts(session.facts),
    });

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
    logInfo("session.service", "session.facts_patched", {
      sessionId,
      step: session.step,
      patch: summarizeSessionFacts(patch),
      facts: summarizeSessionFacts(session.facts),
    });
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

    const previousStep = session.step;
    session.step = step;
    session.facts = {
      ...session.facts,
      ...factsPatch,
    };

    await session.save();
    logInfo("session.service", "session.step_and_facts_updated", {
      sessionId,
      ...summarizeTransition(previousStep, step),
      patch: summarizeSessionFacts(factsPatch),
      facts: summarizeSessionFacts(session.facts),
    });
    return session;
  },

  toObjectId(id: string) {
    return new Types.ObjectId(id);
  },
};
