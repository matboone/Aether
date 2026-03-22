"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type {
  ChatMessageResponseDto,
  CreateSessionResponseDto,
  ProcessBillResponseDto,
  UploadBillResponseDto,
} from "@/src/types/dto";
import type {
  RenderableSessionUi,
  SessionFacts as DomainSessionFacts,
  SessionStep,
} from "@/src/types/domain";
import type { Stage, Message, ModuleType, SessionFacts } from "@/app/_types/dashboard";
import {
  EMPTY_FACTS,
  INCOME_BRACKET_SERVER_TO_LABEL,
  SUGGESTION_CHIPS,
  formatIncomeBracketLabel,
} from "@/app/_constants/dashboard";
import type { GetSessionResponseDto } from "@/src/types/dto";
import { deriveSessionBillTitle } from "@/app/_lib/derive-session-bill-title";
import { loadChatNodes, upsertChatNode, type ChatHistoryNode } from "@/app/_lib/chat-history-storage";
import {
  nextModules,
  rightPanelModulesFromUi,
  RIGHT_PANEL_MODULE_TYPES,
} from "@/app/_lib/session-modules";

/** Pill label → API bracket (must stay in sync with app/_constants/dashboard INCOME_OPTIONS) */
const UI_LABEL_TO_SERVER_BRACKET: Record<string, string> = {
  "Under $25k": "0_50k",
  "$25k\u2013$40k": "0_50k",
  "$40k\u2013$60k": "0_50k",
  "$60k\u2013$80k": "50k_80k",
  "$80k+": "80k_plus",
  "Prefer not to say": "80k_plus",
};

interface ProfileInfo {
  accountId: string | null;
  accountName: string;
  status: string;
}

export interface ChatEngine {
  stage: Stage;
  messages: Message[];
  facts: SessionFacts;
  flashFields: Set<string>;
  isTyping: boolean;
  inputValue: string;
  uploaded: boolean;
  analysisReady: boolean;
  selectedIncome: string | null;
  householdSize: number;
  incomeConfirmed: boolean;
  showMoreItems: boolean;
  summaryExpanded: boolean;
  activeNav: number;
  openSections: Record<string, boolean>;
  techIdsOpen: boolean;
  hasStarted: boolean;
  sessionId: string | null;
  backendUi: RenderableSessionUi | null;
  isUploading: boolean;
  uploadFilename: string | null;
  uploadSizeLabel: string | null;
  suggestionChips: string[];
  profile: ProfileInfo;
  rightPanelModules: ModuleType[];
  minimizedModules: Set<ModuleType>;
  moduleRevealMessageId: string | null;
  moduleRevealCount: number;
  loadingStepNumber: number | null;
  toggleMinimize: (m: ModuleType) => void;

  threadRef: React.RefObject<HTMLDivElement | null>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;

  handleSend: (text?: string) => void;
  handleUpload: (file: File) => void;
  handleIncomeConfirm: () => void;
  handleChipClick: (text: string) => void;
  handleTextareaChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  clearSession: () => void;
  setInputValue: (v: string) => void;
  setSelectedIncome: (v: string | null) => void;
  setHouseholdSize: React.Dispatch<React.SetStateAction<number>>;
  setShowMoreItems: (v: boolean) => void;
  setSummaryExpanded: (v: boolean) => void;
  setActiveNav: (v: number) => void;
  setOpenSections: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setTechIdsOpen: (v: boolean) => void;

  chatNodes: ChatHistoryNode[];
  loadChatSession: (sessionId: string) => Promise<void>;
  isLoadingChatSession: boolean;
}

const NON_MINIMIZABLE_MODULES: Set<ModuleType> = new Set([
  "bill-summary",
  "line-items",
  "eligibility",
]);

const MODULE_REVEAL_INTERVAL_MS = 1200;

function formatCurrency(value: number | null | undefined): string | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function mapSessionStepToStage(step: SessionStep): Stage {
  switch (step) {
    case "NEW":
    case "INTAKE":
      return "INTRO";
    case "AWAITING_BILL_UPLOAD":
      return "BILL_UPLOAD";
    case "BILL_UPLOADED":
    case "BILL_PARSED":
      return "BILL_PROCESSING";
    case "BILL_ANALYZED":
      return "ANALYSIS_COMPLETE";
    case "AWAITING_INCOME":
      return "INCOME_CHECK";
    case "STRATEGY_READY":
      return "ACTION_PLAN";
    case "NEGOTIATION_IN_PROGRESS":
      return "SCRIPT_GENERATED";
    case "RESOLUTION_RECORDED":
    case "COMPLETE":
      return "RESOLVED";
    case "ERROR":
      return "ITEMIZED_EXPLAIN";
    default:
      return "INTRO";
  }
}

function mapDomainFactsToDashboardFacts(facts: DomainSessionFacts, ui?: RenderableSessionUi | null): SessionFacts {
  let hasInsurance: SessionFacts["hasInsurance"] = null;
  if (facts.hasInsurance === true) hasInsurance = "insured";
  if (facts.hasInsurance === false) hasInsurance = "uninsured";

  let assistanceEligible: SessionFacts["assistanceEligible"] = null;
  if (facts.assistanceEligible === true) assistanceEligible = "likely";
  if (facts.assistanceEligible === false) assistanceEligible = "unlikely";

  const originalAmount = facts.negotiationOutcome?.originalAmount ?? facts.estimatedBillTotal ?? null;
  /* Derive reduced from: resolution outcome → analysis overcharge estimate → null */
  let reducedAmount = facts.negotiationOutcome?.reducedAmount ?? null;
  if (reducedAmount === null && ui?.analysisSummary && facts.estimatedBillTotal) {
    reducedAmount = Math.max(0, facts.estimatedBillTotal - (ui.analysisSummary.estimatedOvercharge ?? 0));
  }
  if (reducedAmount === null && ui?.resolutionSummary?.reducedAmount != null) {
    reducedAmount = ui.resolutionSummary.reducedAmount;
  }

  return {
    hospitalName: facts.hospitalName ?? null,
    hospitalId: facts.hospitalId ?? null,
    hasInsurance,
    incidentSummary: facts.incidentSummary ?? null,
    estimatedBillTotal: formatCurrency(facts.estimatedBillTotal) ?? null,
    uploadedBillId: facts.uploadedBillId ?? null,
    parsedBillId: facts.parsedBillId ?? null,
    analysisId: facts.analysisId ?? null,
    incomeBracket: formatIncomeBracketLabel(facts.incomeBracket),
    householdSize: facts.householdSize ?? null,
    assistanceEligible,
    negotiationOutcome:
      originalAmount !== null || reducedAmount !== null
        ? {
            original: originalAmount ?? 0,
            reduced: reducedAmount ?? 0,
            paymentPlan: Boolean(facts.negotiationOutcome?.paymentPlanOffered),
            notes: facts.negotiationOutcome?.notes ?? "",
          }
        : null,
  };
}

function mapServerRowsToMessages(
  rows: Array<{ id: string; role: string; content: string }>,
  step: SessionStep,
  ui: RenderableSessionUi,
  facts: DomainSessionFacts,
): Message[] {
  const chat: Message[] = [];
  for (const row of rows) {
    if (row.role === "system") continue;
    const sender = row.role === "assistant" ? "ai" : "user";
    chat.push({ id: row.id, sender, text: row.content });
  }
  const inlineMods = nextModules(step, ui, facts).filter((m) => !RIGHT_PANEL_MODULE_TYPES.has(m));
  if (inlineMods.length === 0) return chat;
  for (let i = chat.length - 1; i >= 0; i -= 1) {
    if (chat[i].sender === "ai") {
      chat[i] = { ...chat[i], modules: inlineMods };
      break;
    }
  }
  return chat;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function toIncomeInputBracket(input: string): string {
  const trimmed = input.trim();
  return UI_LABEL_TO_SERVER_BRACKET[trimmed] ?? "0_50k";
}

function shortAccount(sessionId: string | null): string {
  if (!sessionId) return "Not started";
  return `ACCT-${sessionId.slice(-6).toUpperCase()}`;
}

function uniqueFirstThree(chips: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const chip of chips) {
    const cleaned = chip.trim();
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(cleaned);
    if (out.length >= 3) break;
  }
  return out;
}

function isQuestion(text: string): boolean {
  return text.trim().endsWith("?");
}

function deriveSuggestionChips(input: {
  stage: Stage;
  messages: Message[];
  facts: SessionFacts;
  uploaded: boolean;
  analysisReady: boolean;
  isTyping: boolean;
  isUploading: boolean;
}): string[] {
  const chips: string[] = [];
  const lastAi = [...input.messages].reverse().find((message) => message.sender === "ai")?.text.toLowerCase() ?? "";

  switch (input.stage) {
    case "INTRO":
      chips.push(
        "Can you walk me through this step by step?",
        "What information do you need first to help me?",
        "Can you explain how this process works?",
      );
      break;
    case "HOSPITAL_ID":
      chips.push(
        "Where can I find the provider name on my statement?",
        "How can I confirm which hospital actually billed me?",
        "What should I do if I’m not sure which provider sent this bill?",
      );
      break;
    case "INSURANCE_CHECK":
      chips.push(
        "How does having insurance change the strategy?",
        "What if I’m uninsured?",
        "What if I’m underinsured?",
      );
      break;
    case "ITEMIZED_EXPLAIN":
      chips.push(
        "What is an itemized bill?",
        "How do I request it from billing?",
        "What do I do if I don’t have one yet?",
      );
      break;
    case "BILL_UPLOAD":
      chips.push(
        "What counts as an itemized bill PDF?",
        "Can I upload a photo instead of a PDF?",
        "What should I do if I don’t have the file yet?",
      );
      break;
    case "BILL_PROCESSING":
      chips.push(
        "What happens while this is processing?",
        "How long does analysis usually take?",
        "What will you check first?",
      );
      break;
    case "ANALYSIS_COMPLETE":
      chips.push(
        "Can you explain the flagged charges?",
        "What are my estimated savings?",
        "What should I do first?",
      );
      break;
    case "INCOME_CHECK":
      chips.push(
        "Why do you need my income bracket?",
        "How will income affect my eligibility result?",
        "What if I’m not comfortable sharing my exact income?",
      );
      break;
    case "ELIGIBILITY_RESULT":
      chips.push(
        "Am I likely eligible?",
        "What documents do I need?",
        "What should I ask billing next?",
      );
      break;
    case "ACTION_PLAN":
      chips.push(
        "What should my exact first ask be?",
        "Can you summarize my strategy checklist?",
        "Can you draft a short dispute summary I can use?",
      );
      break;
    case "SCRIPT_GENERATED":
      chips.push(
        "Can you give me the exact call script?",
        "How should I respond if they push back?",
        "What phone number should I call?",
      );
      break;
    case "RESOLVED":
      chips.push(
        "Can you summarize my total savings?",
        "How should I ask for a payment plan?",
        "Can we start a new case?",
      );
      break;
    default:
      break;
  }

  if ((input.stage === "BILL_PROCESSING" || input.stage === "ANALYSIS_COMPLETE") && !input.analysisReady) {
    chips.push("Is analysis still running?");
  }

  if (lastAi.includes("itemized") || lastAi.includes("upload")) {
    chips.push("What file should I upload next?");
  }
  if (lastAi.includes("income")) {
    chips.push("Why do you need my income bracket?");
  }
  if (lastAi.includes("payment plan")) {
    chips.push("What should I say to request a payment plan?");
  }

  chips.push(...(SUGGESTION_CHIPS[input.stage] ?? []).filter((chip) => isQuestion(chip)));

  return uniqueFirstThree(chips.filter((chip) => isQuestion(chip)));
}

export function useChatEngine(): ChatEngine {
  const [stage, setStage] = useState<Stage>("INTRO");
  const [messages, setMessages] = useState<Message[]>([]);
  const [facts, setFacts] = useState<SessionFacts>({ ...EMPTY_FACTS });
  const [flashFields, setFlashFields] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [uploaded, setUploaded] = useState(false);
  const [analysisReady, setAnalysisReady] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<string | null>(null);
  const [householdSize, setHouseholdSize] = useState(1);
  const [incomeConfirmed, setIncomeConfirmed] = useState(false);
  const [showMoreItems, setShowMoreItems] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [activeNav, setActiveNav] = useState(0);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    provider: false,
    bill: false,
    eligibility: false,
    resolution: false,
  });
  const [techIdsOpen, setTechIdsOpen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [backendUi, setBackendUi] = useState<RenderableSessionUi | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFilename, setUploadFilename] = useState<string | null>(null);
  const [uploadSizeLabel, setUploadSizeLabel] = useState<string | null>(null);
  const [rightPanelMods, setRightPanelMods] = useState<ModuleType[]>([]);
  const [minimizedModules, setMinimizedModules] = useState<Set<ModuleType>>(new Set());
  const [moduleRevealMessageId, setModuleRevealMessageId] = useState<string | null>(null);
  const [moduleRevealCount, setModuleRevealCount] = useState(0);
  const [loadingStepNumber, setLoadingStepNumber] = useState<number | null>(null);
  const [chatNodes, setChatNodes] = useState<ChatHistoryNode[]>([]);
  const [isLoadingChatSession, setIsLoadingChatSession] = useState(false);

  const threadRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const factsRef = useRef<SessionFacts>(facts);
  const sessionIdRef = useRef<string | null>(sessionId);
  const backendUiRef = useRef<RenderableSessionUi | null>(null);
  const uploadFilenameRef = useRef<string | null>(null);
  const manuallyExpandedModulesRef = useRef<Set<ModuleType>>(new Set());
  const revealTimersRef = useRef<number[]>([]);

  useEffect(() => {
    factsRef.current = facts;
  }, [facts]);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    backendUiRef.current = backendUi;
  }, [backendUi]);

  useEffect(() => {
    uploadFilenameRef.current = uploadFilename;
  }, [uploadFilename]);

  useEffect(() => {
    setChatNodes(loadChatNodes());
  }, []);

  const flashFact = useCallback((field: string) => {
    setFlashFields((prev) => new Set(prev).add(field));
    setTimeout(() => {
      setFlashFields((prev) => {
        const next = new Set(prev);
        next.delete(field);
        return next;
      });
    }, 650);
  }, []);

  const applyServerState = useCallback(
    (
      nextStep: SessionStep,
      domainFacts: DomainSessionFacts,
      ui: RenderableSessionUi,
      sid: string,
    ) => {
      const visibleModules = nextModules(nextStep, ui, domainFacts);
      const latestModule = visibleModules.at(-1) ?? null;

      setSessionId(sid);
      setStage(mapSessionStepToStage(nextStep));
      setBackendUi(ui);
      setAnalysisReady(Boolean(ui.analysisSummary));
      setUploaded(Boolean(domainFacts.uploadedBillId));
      setRightPanelMods(rightPanelModulesFromUi(nextStep, ui, domainFacts));
      manuallyExpandedModulesRef.current = new Set(
        Array.from(manuallyExpandedModulesRef.current).filter((moduleType) =>
          visibleModules.includes(moduleType),
        ),
      );
      setMinimizedModules(() => {
        const next = new Set<ModuleType>();
        for (const moduleType of visibleModules) {
          if (NON_MINIMIZABLE_MODULES.has(moduleType)) continue;
          if (moduleType === latestModule) continue;
          if (manuallyExpandedModulesRef.current.has(moduleType)) continue;
          next.add(moduleType);
        }
        return next;
      });

      const mapped = mapDomainFactsToDashboardFacts(domainFacts, ui);
      const previous = factsRef.current;
      const changed = Object.keys(mapped).filter((key) => {
        const typedKey = key as keyof SessionFacts;
        return JSON.stringify(previous[typedKey]) !== JSON.stringify(mapped[typedKey]);
      });
      setFacts(mapped);
      changed.forEach((key) => flashFact(key));

      if (domainFacts.incomeBracket) {
        const raw = domainFacts.incomeBracket;
        setSelectedIncome(INCOME_BRACKET_SERVER_TO_LABEL[raw] ?? raw);
        setIncomeConfirmed(true);
      }
    },
    [flashFact],
  );

  const createSession = useCallback(async (): Promise<CreateSessionResponseDto> => {
    const response = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      throw new Error("Unable to create session");
    }
    return response.json() as Promise<CreateSessionResponseDto>;
  }, []);

  const ensureSession = useCallback(async (): Promise<string> => {
    if (sessionIdRef.current) return sessionIdRef.current;
    const created = await createSession();
    applyServerState(created.step, created.facts, created.ui, created.sessionId);
    return created.sessionId;
  }, [applyServerState, createSession]);

  useEffect(() => {
    let canceled = false;
    const bootstrap = async () => {
      try {
        const created = await createSession();
        if (canceled) return;
        applyServerState(created.step, created.facts, created.ui, created.sessionId);
      } catch {
        if (!canceled) {
          setMessages([
            {
              id: `boot-error-${Date.now()}`,
              sender: "ai",
              text: "I couldn’t connect to the server to start your session. This may be a network issue or the database may be unavailable. Type a message and I’ll retry automatically.",
            },
          ]);
        }
      }
    };
    void bootstrap();
    return () => {
      canceled = true;
    };
  }, [applyServerState, createSession]);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTo({
        top: threadRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isTyping]);

  useEffect(() => {
    const sectionHasData: Record<string, boolean> = {
      provider: !!(facts.hospitalName || facts.hospitalId),
      bill: !!(facts.estimatedBillTotal || facts.uploadedBillId),
      eligibility: !!(facts.incomeBracket || facts.assistanceEligible),
      resolution: !!facts.negotiationOutcome,
    };
    setOpenSections((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const key of Object.keys(sectionHasData)) {
        if (sectionHasData[key] && !prev[key]) {
          next[key] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [facts]);

  const addMessage = useCallback((msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const clearRevealTimers = useCallback(() => {
    for (const timerId of revealTimersRef.current) {
      window.clearTimeout(timerId);
    }
    revealTimersRef.current = [];
  }, []);

  const sendChat = useCallback(
    async (
      content: string,
      options?: {
        factPatch?: Partial<DomainSessionFacts>;
        incomeInput?: {
          incomeBracket?: string | null;
          incomeAmount?: number | null;
          householdSize?: number | null;
        };
      },
    ) => {
      const sid = await ensureSession();
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sid,
          content,
          factPatch: options?.factPatch,
          incomeInput: options?.incomeInput,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to send message");
      }

      const data = (await response.json()) as ChatMessageResponseDto;
      applyServerState(data.step, data.facts, data.ui, data.sessionId);

      const modules = nextModules(data.step, data.ui, data.facts);
      const inlineModules = modules.filter((m) => !RIGHT_PANEL_MODULE_TYPES.has(m));
      const aiMessageId = `ai-${Date.now()}`;

      clearRevealTimers();
      if (inlineModules.length > 0) {
        setModuleRevealMessageId(aiMessageId);
        setModuleRevealCount(1);
        setLoadingStepNumber(2);

        for (let i = 2; i <= inlineModules.length; i += 1) {
          const timerId = window.setTimeout(() => {
            setModuleRevealCount(i);
            setLoadingStepNumber(Math.min(9, i + 1));
          }, MODULE_REVEAL_INTERVAL_MS * (i - 1));
          revealTimersRef.current.push(timerId);
        }

        const doneTimer = window.setTimeout(() => {
          setLoadingStepNumber(null);
        }, MODULE_REVEAL_INTERVAL_MS * Math.max(inlineModules.length, 1));
        revealTimersRef.current.push(doneTimer);
      } else {
        setModuleRevealMessageId(null);
        setModuleRevealCount(0);
        setLoadingStepNumber(null);
      }

      addMessage({
        id: aiMessageId,
        sender: "ai",
        text: data.assistantMessage,
        modules,
      });
    },
    [addMessage, applyServerState, clearRevealTimers, ensureSession],
  );

  const handleSend = useCallback(
    (text?: string) => {
      if (isTyping || isUploading || loadingStepNumber !== null) return;
      const msg = text ?? inputValue.trim();
      if (!msg) return;
      setInputValue("");
      if (!hasStarted) setHasStarted(true);

      addMessage({ id: `user-${Date.now()}`, sender: "user", text: msg });

      const run = async () => {
        try {
          setIsTyping(true);
          await sendChat(msg);
        } catch (err) {
          const detail =
            err instanceof Error && err.message === "Unable to send message"
              ? "The server returned an error."
              : "Could not reach the server.";
          addMessage({
            id: `ai-error-${Date.now()}`,
            sender: "ai",
            text: `I couldn’t process that message. ${detail} Please try again.`,
          });
        } finally {
          setIsTyping(false);
        }
      };

      void run();
    },
    [addMessage, hasStarted, inputValue, isTyping, isUploading, loadingStepNumber, sendChat],
  );

  const handleUpload = useCallback(
    (file: File) => {
      const name = file.name.toLowerCase();
      const mime = file.type.toLowerCase();
      const isSupportedBill =
        mime === "application/pdf" ||
        mime === "image/png" ||
        mime === "image/jpeg" ||
        name.endsWith(".pdf") ||
        name.endsWith(".png") ||
        name.endsWith(".jpg") ||
        name.endsWith(".jpeg");

      if (!isSupportedBill) {
        addMessage({
          id: `ai-upload-type-${Date.now()}`,
          sender: "ai",
          text: "Please attach a bill file as PDF, PNG, or JPG so I can process it.",
        });
        return;
      }

      const run = async () => {
        try {
          if (!hasStarted) setHasStarted(true);
          addMessage({
            id: `user-upload-${Date.now()}`,
            sender: "user",
            text: `Attached: ${file.name}`,
          });
          setIsUploading(true);
          const sid = await ensureSession();
          const formData = new FormData();
          formData.append("sessionId", sid);
          formData.append("file", file);

          const uploadResponse = await fetch("/api/bills/upload", {
            method: "POST",
            body: formData,
          });
          if (!uploadResponse.ok) throw new Error("Upload failed");
          const uploadData = (await uploadResponse.json()) as UploadBillResponseDto;

          setUploadFilename(uploadData.filename);
          setUploadSizeLabel(formatFileSize(file.size));
          setUploaded(true);
          flashFact("uploadedBillId");

          setIsTyping(true);
          const processResponse = await fetch(`/api/bills/${uploadData.uploadedBillId}/process`, {
            method: "POST",
          });
          if (!processResponse.ok) throw new Error("Processing failed");
          const processData = (await processResponse.json()) as ProcessBillResponseDto;
          applyServerState(processData.step, processData.facts, processData.ui, processData.sessionId);

          try {
            await sendChat(`I uploaded ${uploadData.filename}.`);
          } catch {
            addMessage({
              id: `ai-upload-chat-error-${Date.now()}`,
              sender: "ai",
              text: "Your bill was processed successfully. I couldn’t generate a response yet — please send a follow-up message.",
            });
          }
        } catch {
          addMessage({
            id: `ai-upload-error-${Date.now()}`,
            sender: "ai",
            text: "I couldn’t upload or process that file. Please check your connection and try again.",
          });
        } finally {
          setIsTyping(false);
          setIsUploading(false);
        }
      };

      void run();
    },
    [addMessage, applyServerState, ensureSession, flashFact, hasStarted, sendChat],
  );

  const handleIncomeConfirm = useCallback(() => {
    if (!selectedIncome) return;

    setIncomeConfirmed(true);
    const userText = `My household income is ${selectedIncome} (household size: ${householdSize})`;
    addMessage({
      id: `user-income-${Date.now()}`,
      sender: "user",
      text: userText,
    });

    const run = async () => {
      try {
        setIsTyping(true);
        await sendChat(userText, {
          incomeInput: {
            incomeBracket: toIncomeInputBracket(selectedIncome),
            householdSize,
          },
        });
      } catch {
        addMessage({
          id: `ai-income-error-${Date.now()}`,
          sender: "ai",
          text: "I couldn’t save your income details right now. Please retry.",
        });
      } finally {
        setIsTyping(false);
      }
    };

    void run();
  }, [addMessage, householdSize, selectedIncome, sendChat]);

  const loadChatSession = useCallback(
    async (targetId: string) => {
      if (!targetId || targetId === sessionIdRef.current) return;
      setIsLoadingChatSession(true);
      clearRevealTimers();
      try {
        const [sessResp, msgResp] = await Promise.all([
          fetch(`/api/sessions/${targetId}`),
          fetch(`/api/sessions/${targetId}/messages`),
        ]);
        if (!sessResp.ok) throw new Error("session");
        const data = (await sessResp.json()) as GetSessionResponseDto;
        let rows: Array<{ id: string; role: string; content: string }> = [];
        if (msgResp.ok) {
          const msgData = (await msgResp.json()) as {
            messages?: Array<{ id: string; role: string; content: string }>;
          };
          rows = msgData.messages ?? [];
        }
        const hydrated = mapServerRowsToMessages(rows, data.step, data.ui, data.facts);
        const inlineMods = nextModules(data.step, data.ui, data.facts).filter(
          (m) => !RIGHT_PANEL_MODULE_TYPES.has(m),
        );
        let lastAiId: string | null = null;
        for (let i = hydrated.length - 1; i >= 0; i -= 1) {
          if (hydrated[i].sender === "ai") {
            lastAiId = hydrated[i].id;
            break;
          }
        }

        if (!data.facts.incomeBracket) {
          setSelectedIncome(null);
          setIncomeConfirmed(false);
        }
        setHouseholdSize(data.facts.householdSize ?? 1);

        applyServerState(data.step, data.facts, data.ui, data.sessionId);
        setMessages(hydrated);
        setHasStarted(true);
        setModuleRevealMessageId(lastAiId);
        setModuleRevealCount(inlineMods.length);
        setLoadingStepNumber(null);
        setInputValue("");
        setIsTyping(false);
        setIsUploading(false);
        manuallyExpandedModulesRef.current = new Set();

        const dashboardFacts = mapDomainFactsToDashboardFacts(data.facts, data.ui);
        const title = deriveSessionBillTitle({
          facts: dashboardFacts,
          backendUi: data.ui,
          uploadFilename: null,
          hasStarted: true,
        });
        setChatNodes(upsertChatNode({ sessionId: data.sessionId, title, updatedAt: Date.now() }));
      } catch {
        addMessage({
          id: `ai-load-${Date.now()}`,
          sender: "ai",
          text: "Couldn’t load that conversation. It may have been removed or the server is unreachable.",
        });
      } finally {
        setIsLoadingChatSession(false);
      }
    },
    [addMessage, applyServerState, clearRevealTimers],
  );

  const clearSession = useCallback(() => {
    const sid = sessionIdRef.current;
    if (sid && hasStarted) {
      const title = deriveSessionBillTitle({
        facts: factsRef.current,
        backendUi: backendUiRef.current,
        uploadFilename: uploadFilenameRef.current,
        hasStarted: true,
      });
      setChatNodes(upsertChatNode({ sessionId: sid, title, updatedAt: Date.now() }));
    }

    setStage("INTRO");
    setMessages([]);
    setFacts({ ...EMPTY_FACTS });
    setFlashFields(new Set());
    setIsTyping(false);
    setInputValue("");
    setUploaded(false);
    setAnalysisReady(false);
    setSelectedIncome(null);
    setHouseholdSize(1);
    setIncomeConfirmed(false);
    setShowMoreItems(false);
    setSummaryExpanded(false);
    setOpenSections({ provider: false, bill: false, eligibility: false, resolution: false });
    setTechIdsOpen(false);
    setHasStarted(false);
    setBackendUi(null);
    setSessionId(null);
    setUploadFilename(null);
    setUploadSizeLabel(null);
    setRightPanelMods([]);
    setMinimizedModules(new Set());
    setModuleRevealMessageId(null);
    setModuleRevealCount(0);
    setLoadingStepNumber(null);
    clearRevealTimers();
    manuallyExpandedModulesRef.current = new Set();

    const run = async () => {
      try {
        const created = await createSession();
        applyServerState(created.step, created.facts, created.ui, created.sessionId);
      } catch {
        addMessage({
          id: `ai-reset-error-${Date.now()}`,
          sender: "ai",
          text: "A new session will be created when you send your next message.",
        });
      }
    };

    void run();
  }, [addMessage, applyServerState, clearRevealTimers, createSession, hasStarted]);

  const handleChipClick = useCallback(
    (text: string) => {
      if (isTyping || isUploading || loadingStepNumber !== null) return;
      setInputValue(text);
      setTimeout(() => handleSend(text), 200);
    },
    [handleSend, isTyping, isUploading, loadingStepNumber],
  );

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 96)}px`;
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const toggleMinimize = useCallback((m: ModuleType) => {
    if (NON_MINIMIZABLE_MODULES.has(m)) {
      return;
    }
    setMinimizedModules((prev) => {
      const next = new Set(prev);
      if (next.has(m)) {
        next.delete(m);
        manuallyExpandedModulesRef.current.add(m);
      } else {
        next.add(m);
        manuallyExpandedModulesRef.current.delete(m);
      }
      return next;
    });
  }, []);

  const suggestionChips = useMemo(
    () =>
      deriveSuggestionChips({
        stage,
        messages,
        facts,
        uploaded,
        analysisReady,
        isTyping,
        isUploading,
      }),
    [analysisReady, facts, isTyping, isUploading, messages, stage, uploaded],
  );

  /* ─── Live-poll session state so facts panel updates in real-time ─── */
  const ACTIVE_POLL_STEPS: Set<SessionStep> = useMemo(
    () => new Set(["BILL_UPLOADED", "BILL_PARSED", "BILL_ANALYZED"]),
    [],
  );

  useEffect(() => {
    if (!sessionId) return;
    const pollMs = ACTIVE_POLL_STEPS.has(stage as SessionStep) ? 4000 : 10000;
    const interval = setInterval(async () => {
      try {
        const resp = await fetch(`/api/sessions/${sessionId}`);
        if (!resp.ok) return;
        const data = (await resp.json()) as { step: SessionStep; facts: DomainSessionFacts; ui: RenderableSessionUi };
        applyServerState(data.step, data.facts, data.ui, sessionId);
      } catch {
        /* silent — best-effort polling */
      }
    }, pollMs);
    return () => clearInterval(interval);
  }, [sessionId, stage, applyServerState, ACTIVE_POLL_STEPS]);

  return {
    stage,
    messages,
    facts,
    flashFields,
    isTyping,
    inputValue,
    uploaded,
    analysisReady,
    selectedIncome,
    householdSize,
    incomeConfirmed,
    showMoreItems,
    summaryExpanded,
    activeNav,
    openSections,
    techIdsOpen,
    hasStarted,
    sessionId,
    backendUi,
    isUploading,
    uploadFilename,
    uploadSizeLabel,
    suggestionChips,
    profile: {
      accountId: sessionId,
      accountName: shortAccount(sessionId),
      status: stage.replaceAll("_", " "),
    },
    rightPanelModules: rightPanelMods,
    minimizedModules,
    moduleRevealMessageId,
    moduleRevealCount,
    loadingStepNumber,
    toggleMinimize,
    threadRef,
    textareaRef,
    handleSend,
    handleUpload,
    handleIncomeConfirm,
    handleChipClick,
    handleTextareaChange,
    handleKeyDown,
    clearSession,
    setInputValue,
    setSelectedIncome,
    setHouseholdSize,
    setShowMoreItems,
    setSummaryExpanded,
    setActiveNav,
    setOpenSections,
    setTechIdsOpen,
    chatNodes,
    loadChatSession,
    isLoadingChatSession,
  };
}
