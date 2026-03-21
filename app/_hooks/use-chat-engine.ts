"use client";

/* ═══════════════════════════════════════════════════════
   Aether — Chat Engine Hook
   All state management & business logic for the dashboard
   ═══════════════════════════════════════════════════════ */

import { useState, useRef, useEffect, useCallback } from "react";
import type {
  Stage,
  Message,
  SessionFacts,
} from "@/app/_types/dashboard";
import { EMPTY_FACTS } from "@/app/_constants/dashboard";

export interface ChatEngine {
  /* State */
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

  /* Refs */
  threadRef: React.RefObject<HTMLDivElement | null>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;

  /* Actions */
  handleSend: (text?: string) => void;
  handleUpload: () => void;
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
    provider: true,
    patient: true,
    bill: true,
    eligibility: true,
    resolution: true,
  });
  const [techIdsOpen, setTechIdsOpen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const threadRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* ─── Scroll to bottom on new messages ─── */
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTo({
        top: threadRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isTyping]);

  /* ─── Flash a session fact field ─── */
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

  /* ─── Helpers ─── */
  const addMessage = useCallback(
    (msg: Message) => setMessages((prev) => [...prev, msg]),
    []
  );

  const showTypingThenMessage = useCallback(
    (msg: Message, delay = 1400) => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        addMessage(msg);
      }, delay);
    },
    [addMessage]
  );

  /* ─── Handle user input / chip clicks ─── */
  const handleSend = useCallback(
    (text?: string) => {
      const msg = text ?? inputValue.trim();
      if (!msg) return;
      setInputValue("");

      /* First message transitions from welcome hero to chat */
      if (!hasStarted) {
        setHasStarted(true);
      }

      const userMsg: Message = {
        id: `user-${Date.now()}`,
        sender: "user",
        text: msg,
      };
      addMessage(userMsg);

      switch (stage) {
        case "INTRO": {
          setStage("HOSPITAL_ID");
          showTypingThenMessage({
            id: "ask-hospital",
            sender: "ai",
            text: "I\u2019d love to help with that. First, can you tell me which hospital or health system sent you this bill? If you have the bill handy, the name should be right at the top.",
          });
          break;
        }
        case "HOSPITAL_ID": {
          const name = msg.toLowerCase().includes("tristar")
            ? "TriStar Medical Center"
            : msg;
          setFacts((f) => ({
            ...f,
            hospitalName: name,
            hospitalId: "HCA-TS-4821",
          }));
          flashFact("hospitalName");
          flashFact("hospitalId");
          setStage("INSURANCE_CHECK");
          showTypingThenMessage({
            id: "ask-insurance",
            sender: "ai",
            text: `Got it \u2014 ${name}. That\u2019s part of the HCA Healthcare network, which actually has some of the more generous financial assistance programs available. Now, do you currently have health insurance, or were you uninsured when this visit happened?`,
          });
          break;
        }
        case "INSURANCE_CHECK": {
          const lower = msg.toLowerCase();
          let status: "insured" | "uninsured" | "unknown" = "unknown";
          let summary = "";
          if (lower.includes("no ") || lower.includes("uninsured")) {
            status = "uninsured";
            summary =
              "Emergency visit, currently uninsured, received bill from TriStar Medical Center";
          } else if (lower.includes("insured") || lower.includes("have")) {
            status = lower.includes("under") ? "uninsured" : "insured";
            summary =
              "Medical visit with insurance concerns, bill from TriStar Medical Center";
          }
          setFacts((f) => ({
            ...f,
            hasInsurance: status,
            incidentSummary: summary || `Patient reported: \u201C${msg}\u201D`,
          }));
          flashFact("hasInsurance");
          flashFact("incidentSummary");
          setStage("BILL_UPLOAD");
          showTypingThenMessage({
            id: "ask-upload",
            sender: "ai",
            text: "Thank you for sharing that. This is important information that will help us find the best path forward. Now, let\u2019s take a look at your bill. If you have a photo or PDF, go ahead and upload it below. I\u2019ll extract all the details automatically.",
            modules: ["upload"],
          });
          break;
        }
        case "ITEMIZED_EXPLAIN": {
          setStage("BILL_UPLOAD");
          showTypingThenMessage({
            id: "explain-itemized",
            sender: "ai",
            text: "An itemized bill lists every single charge separately, like a detailed receipt. Hospitals are required to provide one if you ask. Don\u2019t worry though \u2014 you can upload whatever bill you have right now, and we\u2019ll work with it. If we need the itemized version later, I\u2019ll help you request one.",
            modules: ["upload"],
          });
          break;
        }
        case "ANALYSIS_COMPLETE": {
          setStage("INCOME_CHECK");
          showTypingThenMessage({
            id: "ask-income",
            sender: "ai",
            text: "Now let\u2019s check if you might qualify for financial assistance. TriStar\u2019s HCA charity care program can reduce or even eliminate your bill entirely depending on your household income. This information stays private and is only used to estimate eligibility.",
            modules: ["income-selector"],
          });
          break;
        }
        case "ELIGIBILITY_RESULT": {
          setStage("ACTION_PLAN");
          showTypingThenMessage(
            {
              id: "action-plan",
              sender: "ai",
              text: "Here\u2019s a concrete plan to get this resolved. I\u2019ve organized the steps in priority order, and I\u2019ve started generating the documents you\u2019ll need for each one.",
              modules: ["action-plan", "doc-chips"],
            },
            1600
          );
          break;
        }
        case "ACTION_PLAN": {
          setStage("SCRIPT_GENERATED");
          showTypingThenMessage(
            {
              id: "script-gen",
              sender: "ai",
              text: "I\u2019ve put together a word-for-word call script tailored to TriStar\u2019s billing department. This covers exactly what to say, how to ask for financial assistance, and what to do if they push back.",
              modules: ["phone-script"],
            },
            1600
          );
          break;
        }
        case "SCRIPT_GENERATED": {
          setStage("RESOLVED");
          const outcome = {
            original: 6000,
            reduced: 450,
            paymentPlan: true,
            notes:
              "Charity care waiver approved for 92.5% of balance. Remaining $450 eligible for 24-month interest-free payment plan.",
          };
          setFacts((f) => ({ ...f, negotiationOutcome: outcome }));
          flashFact("negotiationOutcome");
          showTypingThenMessage(
            {
              id: "resolved",
              sender: "ai",
              text: "Wonderful news. Based on the charity care application, TriStar has approved a near-complete waiver of your bill. Here\u2019s the final breakdown of your resolution.",
              modules: ["resolution"],
            },
            1800
          );
          break;
        }
        default:
          break;
      }
    },
    [inputValue, stage, hasStarted, addMessage, showTypingThenMessage, flashFact]
  );

  /* ─── Handle upload simulation ─── */
  const handleUpload = useCallback(() => {
    setUploaded(true);
    setStage("BILL_PROCESSING");
    setFacts((f) => ({
      ...f,
      uploadedBillId: "bill_upl_89211",
      estimatedBillTotal: "$6,000.00",
    }));
    flashFact("uploadedBillId");
    flashFact("estimatedBillTotal");

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addMessage({
        id: "bill-processing",
        sender: "ai",
        text: "I\u2019ve received your bill. Let me extract the details and run it against our fair-pricing database. This will just take a moment.",
        modules: ["bill-receipt", "bill-summary"],
      });
      setTimeout(() => {
        setAnalysisReady(true);
        setFacts((f) => ({
          ...f,
          parsedBillId: "prs_bill_89211",
          analysisId: "anl_89211_v2",
        }));
        flashFact("parsedBillId");
        flashFact("analysisId");
        setStage("ANALYSIS_COMPLETE");

        setTimeout(() => {
          addMessage({
            id: "analysis-done",
            sender: "ai",
            text: "The analysis is complete. I found a few charges that look unusual \u2014 one possible duplicate and two items that appear significantly higher than typical rates. Here\u2019s the detailed breakdown.",
            modules: ["line-items"],
          });
        }, 800);
      }, 2000);
    }, 1400);
  }, [addMessage, flashFact]);

  /* ─── Handle income confirmation ─── */
  const handleIncomeConfirm = useCallback(() => {
    if (!selectedIncome) return;
    setIncomeConfirmed(true);
    setFacts((f) => ({
      ...f,
      incomeBracket: selectedIncome,
      householdSize,
      assistanceEligible: "checking",
    }));
    flashFact("incomeBracket");
    flashFact("householdSize");

    const userMsg: Message = {
      id: `user-income-${Date.now()}`,
      sender: "user",
      text: `My household income is ${selectedIncome} (household size: ${householdSize})`,
    };
    addMessage(userMsg);

    setTimeout(() => {
      setFacts((f) => ({ ...f, assistanceEligible: "likely" }));
      flashFact("assistanceEligible");
    }, 800);

    setStage("ELIGIBILITY_RESULT");
    showTypingThenMessage(
      {
        id: "eligibility-result",
        sender: "ai",
        text: "Great news \u2014 based on what you\u2019ve shared, it looks like you have a strong case for financial assistance.",
        modules: ["eligibility"],
      },
      1600
    );
  }, [selectedIncome, householdSize, addMessage, showTypingThenMessage, flashFact]);

  /* ─── Clear session ─── */
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
    setTechIdsOpen(false);
    setHasStarted(false);
  }, []);

  /* ─── Chip click handler ─── */
  const handleChipClick = useCallback(
    (text: string) => {
      setInputValue(text);
      setTimeout(() => handleSend(text), 200);
    },
    [handleSend]
  );

  /* ─── Textarea auto-resize ─── */
  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputValue(e.target.value);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 96)}px`;
      }
    },
    []
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

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
