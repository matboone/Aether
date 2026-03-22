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
import { EMPTY_FACTS, SUGGESTION_CHIPS } from "@/app/_constants/dashboard";

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
}

const MODULE_ORDER: ModuleType[] = [
  "upload",
  "bill-summary",
  "line-items",
  "income-selector",
  "eligibility",
  "action-plan",
  "doc-chips",
  "phone-script",
  "resolution",
];

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
    incomeBracket: facts.incomeBracket ?? null,
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

/* Modules that belong in the right strategy panel instead of inline in chat */
const RIGHT_PANEL_MODULE_TYPES: Set<ModuleType> = new Set([
  "action-plan",
  "doc-chips",
  "phone-script",
]);

function nextModules(step: SessionStep, ui: RenderableSessionUi, facts: DomainSessionFacts): ModuleType[] {
  const set = new Set<ModuleType>();
  const strategyStillActive =
    step !== "RESOLUTION_RECORDED" && step !== "COMPLETE";

  if (ui.canUploadBill) set.add("upload");
  if (ui.analysisSummary) {
    set.add("bill-summary");
    if ((ui.flaggedItems?.length ?? 0) > 0) {
      set.add("line-items");
    }
  }
  if (step === "AWAITING_INCOME") {
    set.add("income-selector");
  }
  if (facts.assistanceEligible !== null && facts.assistanceEligible !== undefined) {
    set.add("eligibility");
  }
  if (ui.negotiationPlan && strategyStillActive) {
    set.add("action-plan");
    set.add("doc-chips");
    set.add("phone-script");
    if (ui.negotiationPlan.assistanceAssessment) {
      set.add("eligibility");
    }
  }
  /* Resolution only once session is truly complete */
  if (ui.resolutionSummary && (step === "RESOLUTION_RECORDED" || step === "COMPLETE")) {
    set.add("resolution");
  }

  return MODULE_ORDER.filter((moduleType) => set.has(moduleType));
}

function rightPanelModulesFromUi(step: SessionStep, ui: RenderableSessionUi, facts: DomainSessionFacts): ModuleType[] {
  return nextModules(step, ui, facts).filter((m) => RIGHT_PANEL_MODULE_TYPES.has(m));
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function toIncomeInputBracket(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("under") || lower.includes("25") || lower.includes("40") || lower.includes("60")) {
    return "0_50k";
  }
  if (lower.includes("60") || lower.includes("80")) {
    return "50k_80k";
  }
  if (lower.includes("prefer")) {
    return "80k_plus";
  }
  if (lower.includes("80") || lower.includes("plus")) {
    return "80k_plus";
  }
  return "50k_80k";
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
        "I have an unpaid hospital bill",
        "I need help managing a medical bill",
        "Can you walk me through this step by step?",
      );
      break;
    case "HOSPITAL_ID":
      chips.push(
        "The bill is from Cigna Healthcare",
        "I’m not sure which hospital billed me",
        "Where can I find the provider name on my statement?",
      );
      break;
    case "INSURANCE_CHECK":
      chips.push(
        "I have insurance",
        "I’m uninsured",
        "I’m underinsured",
      );
      break;
    case "ITEMIZED_EXPLAIN":
      chips.push(
        "What is an itemized bill?",
        "How do I request it from billing?",
        "I don’t have one yet",
      );
      break;
    case "BILL_UPLOAD":
      chips.push(
        "I can upload the PDF now",
        "What counts as an itemized bill PDF?",
        "I don’t have the PDF yet",
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
        "Tell me about the flagged charges",
        "Show estimated savings",
        "What should I do first?",
      );
      break;
    case "INCOME_CHECK":
      chips.push(
        "Under $25k",
        "$25k–$40k",
        "$40k–$60k",
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
        "Give me the exact first ask",
        "Show my strategy checklist",
        "Draft my dispute summary",
      );
      break;
    case "SCRIPT_GENERATED":
      chips.push(
        "Give me the exact call script",
        "How should I respond if they push back?",
        "What phone number should I call?",
      );
      break;
    case "RESOLVED":
      chips.push(
        "Summarize total savings",
        "Help me ask for a payment plan",
        "Start a new case",
      );
      break;
    default:
      break;
  }

  if (input.stage === "INTRO" && !input.facts.hospitalName) {
    chips.push("The bill is from Cigna Healthcare");
  }

  if (
    (input.stage === "INTRO" || input.stage === "BILL_UPLOAD") &&
    !input.uploaded &&
    !input.facts.uploadedBillId
  ) {
    chips.push("I’m ready to upload my PDF");
  }

  if ((input.stage === "BILL_PROCESSING" || input.stage === "ANALYSIS_COMPLETE") && !input.analysisReady) {
    chips.push("Is analysis still running?");
  }

  if (lastAi.includes("itemized") || lastAi.includes("upload")) {
    chips.push("I’m ready to upload my PDF");
  }
  if (lastAi.includes("income")) {
    chips.push("Why do you need my income bracket?");
  }
  if (lastAi.includes("payment plan")) {
    chips.push("What should I say to request a payment plan?");
  }

  chips.push(...(SUGGESTION_CHIPS[input.stage] ?? []));

  if (input.isTyping || input.isUploading) {
    chips.unshift("Working on that now…");
  }

  return uniqueFirstThree(chips);
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

  const threadRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const factsRef = useRef<SessionFacts>(facts);
  const sessionIdRef = useRef<string | null>(sessionId);
  const manuallyExpandedModulesRef = useRef<Set<ModuleType>>(new Set());

  useEffect(() => {
    factsRef.current = facts;
  }, [facts]);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

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
        setSelectedIncome(domainFacts.incomeBracket);
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
              text: "I couldn’t initialize your session yet. You can still type a message and I’ll retry.",
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

      addMessage({
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: data.assistantMessage,
        modules: nextModules(data.step, data.ui, data.facts),
      });
    },
    [addMessage, applyServerState, ensureSession],
  );

  const handleSend = useCallback(
    (text?: string) => {
      const msg = text ?? inputValue.trim();
      if (!msg) return;
      setInputValue("");
      if (!hasStarted) setHasStarted(true);

      addMessage({ id: `user-${Date.now()}`, sender: "user", text: msg });

      const run = async () => {
        try {
          setIsTyping(true);
          await sendChat(msg);
        } catch {
          addMessage({
            id: `ai-error-${Date.now()}`,
            sender: "ai",
            text: "I hit a connection issue while sending that. Please retry.",
          });
        } finally {
          setIsTyping(false);
        }
      };

      void run();
    },
    [addMessage, hasStarted, inputValue, sendChat],
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
            text: `Attached PDF: ${file.name}`,
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

          await sendChat(`I uploaded ${uploadData.filename}.`);
        } catch {
          addMessage({
            id: `ai-upload-error-${Date.now()}`,
            sender: "ai",
            text: "I couldn’t process that file. Please try uploading again.",
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

  const clearSession = useCallback(() => {
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
  }, [addMessage, applyServerState, createSession]);

  const handleChipClick = useCallback(
    (text: string) => {
      setInputValue(text);
      setTimeout(() => handleSend(text), 200);
    },
    [handleSend],
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
  useEffect(() => {
    if (!sessionId) return;
    const interval = setInterval(async () => {
      try {
        const resp = await fetch(`/api/sessions/${sessionId}`);
        if (!resp.ok) return;
        const data = (await resp.json()) as { step: SessionStep; facts: DomainSessionFacts; ui: RenderableSessionUi };
        applyServerState(data.step, data.facts, data.ui, sessionId);
      } catch {
        /* silent — best-effort polling */
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [sessionId, applyServerState]);

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
  };
}
