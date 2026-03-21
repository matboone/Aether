"use client";

import {
  startTransition,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { ArrowUpRight, LoaderCircle, Paperclip, SendHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CliniqCaseCards, formatCaseMoney } from "@/components/cliniq-case-cards";
import type {
  ChatMessageRequestDto,
  ChatMessageResponseDto,
  CreateSessionResponseDto,
  ProcessBillResponseDto,
  UploadBillResponseDto,
} from "@/src/types/dto";
import type { RenderableSessionUi, SessionFacts, SessionStep } from "@/src/types/domain";

type DisplayMessage = {
  id: string;
  role: "assistant" | "user" | "system";
  content: string;
};

const EMPTY_UI: RenderableSessionUi = {
  canUploadBill: false,
  canUploadItemizedStatement: false,
  hospitalStrategy: null,
  negotiationPlan: null,
  resolutionSummary: null,
};

function buildIntroMessage() {
  return "Tell me what happened with the bill, and I’ll keep the next steps guided and predictable.";
}

function messageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function readJsonOrThrow<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T | { error?: { message?: string } };

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      data.error?.message
        ? data.error.message
        : "Request failed";
    throw new Error(message);
  }

  return data as T;
}

function guidedLabel(step: SessionStep, facts: SessionFacts) {
  if (step === "AWAITING_BILL_UPLOAD") {
    return "Awaiting itemized statement";
  }

  if (step === "AWAITING_INCOME") {
    return "Waiting on income bracket";
  }

  if (step === "STRATEGY_READY") {
    return "Negotiation packet ready";
  }

  if (step === "RESOLUTION_RECORDED") {
    return "Payment-plan follow-up";
  }

  if (step === "COMPLETE") {
    return "Resolution saved";
  }

  if (!facts.hospitalName) {
    return "Collecting hospital details";
  }

  return "Guided conversation";
}

function MessageBubble({ message }: { message: DisplayMessage }) {
  const isAssistant = message.role === "assistant";
  const isSystem = message.role === "system";

  return (
    <div
      className={`max-w-[88%] rounded-[28px] px-4 py-3 shadow-sm ${
        isAssistant
          ? "mr-auto bg-white text-[#1d2f35] ring-1 ring-[#d6e5e7]"
          : isSystem
            ? "mx-auto bg-[#14373c] text-white ring-1 ring-white/10"
            : "ml-auto bg-[#103e45] text-white ring-1 ring-[#235e67]"
      }`}
    >
      <div className="mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] opacity-70">
        {isAssistant ? "Aether" : isSystem ? "System" : "You"}
      </div>
      <p className="text-sm leading-6">{message.content}</p>
    </div>
  );
}

function GuidedReplyRow({
  actions,
  disabled,
}: {
  actions: Array<{
    label: string;
    onClick: () => void;
  }>;
  disabled: boolean;
}) {
  if (!actions.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button
          key={action.label}
          variant="outline"
          size="sm"
          disabled={disabled}
          className="rounded-full border-[#b8d8dc] bg-white/70 text-[#0f444c] hover:bg-[#dff0f2]"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}

function IntakePanel({
  facts,
  draft,
  onDraftChange,
  onSubmitDraft,
  onQuickStart,
  onSelectHospital,
  onSelectInsurance,
  pending,
}: {
  facts: SessionFacts;
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmitDraft: () => void;
  onQuickStart: () => void;
  onSelectHospital: (hospitalName: string) => void;
  onSelectInsurance: (hasInsurance: boolean) => void;
  pending: boolean;
}) {
  return (
    <Card className="border-0 bg-[#fffaf1] ring-1 ring-[#efdcb5]">
      <CardHeader>
        <CardTitle className="text-[#5d3910]">Intake</CardTitle>
        <CardDescription>
          Start with the large-bill concern, then click through the missing facts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!facts.hospitalName && facts.hasInsurance == null ? (
          <GuidedReplyRow
            disabled={pending}
            actions={[
              {
                label: "I got a very large hospital bill",
                onClick: onQuickStart,
              },
              {
                label: "It’s about $6,000",
                onClick: () => onDraftChange("I got a very large hospital bill for about $6000."),
              },
            ]}
          />
        ) : null}

        {!facts.hospitalName ? (
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#875e2f]">
              Hospital
            </div>
            <GuidedReplyRow
              disabled={pending}
              actions={[
                { label: "Cigna Healthcare", onClick: () => onSelectHospital("Cigna Healthcare") },
              ]}
            />
          </div>
        ) : null}

        {facts.hospitalName && (facts.hasInsurance === null || facts.hasInsurance === undefined) ? (
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#875e2f]">
              Insurance
            </div>
            <GuidedReplyRow
              disabled={pending}
              actions={[
                { label: "I have insurance", onClick: () => onSelectInsurance(true) },
                { label: "I don’t have insurance", onClick: () => onSelectInsurance(false) },
              ]}
            />
          </div>
        ) : null}

        <div className="space-y-3">
          <Textarea
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder="Optional: add what happened, the estimated bill total, or any context you want the assistant to use."
            className="min-h-24 border-[#dfc995] bg-white"
          />
          <Button
            disabled={pending || !draft.trim()}
            className="h-10 rounded-full bg-[#7a4a16] px-5 text-white hover:bg-[#63390d]"
            onClick={onSubmitDraft}
          >
            <SendHorizontal className="size-4" />
            Send reply
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function UploadPanel({
  pending,
  onUpload,
  onAskWhatIsItemized,
  onConfirmRequested,
}: {
  pending: boolean;
  onUpload: (file: File) => void;
  onAskWhatIsItemized: () => void;
  onConfirmRequested: () => void;
}) {
  return (
    <Card className="border-0 bg-[#eef7fb] ring-1 ring-[#c6dce8]">
      <CardHeader>
        <CardTitle className="text-[#163d5c]">Itemized statement</CardTitle>
        <CardDescription>
          This is the bill breakdown the hospital gives you. We use it to flag overpriced line items before the negotiation script is built.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <GuidedReplyRow
          disabled={pending}
          actions={[
            {
              label: "What is an itemized statement?",
              onClick: onAskWhatIsItemized,
            },
            {
              label: "I requested it from the hospital",
              onClick: onConfirmRequested,
            },
          ]}
        />
        <div className="rounded-[26px] border border-dashed border-[#8db6c9] bg-white px-4 py-5">
          <label className="flex cursor-pointer flex-col gap-3">
            <div className="flex items-center gap-3 text-sm text-[#234f6d]">
              <Paperclip className="size-4" />
              Upload the itemized statement PDF or image
            </div>
            <Input
              type="file"
              accept=".pdf,image/*,.txt"
              disabled={pending}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  onUpload(file);
                  event.target.value = "";
                }
              }}
            />
          </label>
        </div>
      </CardContent>
    </Card>
  );
}

function IncomePanel({
  pending,
  incomeAmount,
  onIncomeAmountChange,
  onBracketSelect,
  onAmountSubmit,
}: {
  pending: boolean;
  incomeAmount: string;
  onIncomeAmountChange: (value: string) => void;
  onBracketSelect: (bracket: "0_50k" | "50k_80k" | "80k_plus") => void;
  onAmountSubmit: () => void;
}) {
  return (
    <Card className="border-0 bg-[#f7f4ff] ring-1 ring-[#ddd0ff]">
      <CardHeader>
        <CardTitle className="text-[#4c2f87]">Income qualifier</CardTitle>
        <CardDescription>
          Keep this guided for the demo. Either click a bracket or use the exact income amount.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <GuidedReplyRow
          disabled={pending}
          actions={[
            { label: "Under $50k", onClick: () => onBracketSelect("0_50k") },
            { label: "$50k to $80k", onClick: () => onBracketSelect("50k_80k") },
            { label: "$80k+", onClick: () => onBracketSelect("80k_plus") },
          ]}
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={incomeAmount}
            onChange={(event) => onIncomeAmountChange(event.target.value)}
            placeholder="42000"
            className="h-10 border-[#c6b6ff] bg-white"
          />
          <Button
            disabled={pending || !incomeAmount.trim()}
            onClick={onAmountSubmit}
            className="h-10 rounded-full bg-[#6941c6] px-5 text-white hover:bg-[#5734a7]"
          >
            Use exact income
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function OutcomePanel({
  pending,
  reducedAmount,
  notes,
  onReducedAmountChange,
  onNotesChange,
  onSubmitOutcome,
}: {
  pending: boolean;
  reducedAmount: string;
  notes: string;
  onReducedAmountChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onSubmitOutcome: (input: {
    content: string;
    reducedAmount?: number | null;
    resolutionType: "discount" | "payment_plan" | "no_change";
    notes?: string | null;
  }) => void;
}) {
  return (
    <Card className="border-0 bg-[#eef9f1] ring-1 ring-[#c2e6cb]">
      <CardHeader>
        <CardTitle className="text-[#1f5c31]">Negotiation outcome</CardTitle>
        <CardDescription>
          Report what billing offered so the assistant can close the loop.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <GuidedReplyRow
          disabled={pending}
          actions={[
            {
              label: "They reduced it to $450",
              onClick: () =>
                onSubmitOutcome({
                  content: "They reduced it to $450.",
                  reducedAmount: 450,
                  resolutionType: "discount",
                  notes,
                }),
            },
            {
              label: "They offered a payment plan",
              onClick: () =>
                onSubmitOutcome({
                  content: "They offered me a payment plan.",
                  resolutionType: "payment_plan",
                  notes,
                }),
            },
            {
              label: "No change yet",
              onClick: () =>
                onSubmitOutcome({
                  content: "There was no change yet.",
                  resolutionType: "no_change",
                  notes,
                }),
            },
          ]}
        />

        <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr_auto]">
          <Input
            value={reducedAmount}
            onChange={(event) => onReducedAmountChange(event.target.value)}
            placeholder="450"
            className="h-10 border-[#9bd0aa] bg-white"
          />
          <Input
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder="Representative approved a discount after financial assistance screening."
            className="h-10 border-[#9bd0aa] bg-white"
          />
          <Button
            disabled={pending || !reducedAmount.trim()}
            className="h-10 rounded-full bg-[#1b6f34] px-5 text-white hover:bg-[#145629]"
            onClick={() =>
              onSubmitOutcome({
                content: `They reduced it to $${reducedAmount}.`,
                reducedAmount: Number(reducedAmount),
                resolutionType: "discount",
                notes,
              })
            }
          >
            Save result
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ResolutionFollowUpPanel({
  pending,
  onPaymentPlanHelp,
  onCloseCase,
}: {
  pending: boolean;
  onPaymentPlanHelp: () => void;
  onCloseCase: () => void;
}) {
  return (
    <Card className="border-0 bg-[#f4f8ff] ring-1 ring-[#cad7f5]">
      <CardHeader>
        <CardTitle className="text-[#22437a]">Next safe step</CardTitle>
        <CardDescription>
          The outcome is recorded. You can close the case here or ask for a script to negotiate a payment plan on the remaining balance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <GuidedReplyRow
          disabled={pending}
          actions={[
            {
              label: "Help me negotiate a payment plan",
              onClick: onPaymentPlanHelp,
            },
            {
              label: "No, case closed",
              onClick: onCloseCase,
            },
          ]}
        />
      </CardContent>
    </Card>
  );
}

export function CliniqBillingAdvocate() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [step, setStep] = useState<SessionStep>("NEW");
  const [facts, setFacts] = useState<SessionFacts>({});
  const [ui, setUi] = useState<RenderableSessionUi>(EMPTY_UI);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("42000");
  const [resolutionAmount, setResolutionAmount] = useState("450");
  const [resolutionNotes, setResolutionNotes] = useState(
    "They reduced the balance after I raised the flagged charges and assistance option.",
  );
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [casePanelOpen, setCasePanelOpen] = useState(true);
  const initializedRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useEffectEvent(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  });

  useEffect(() => {
    scrollToBottom();
  }, [messages, step]);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }
    initializedRef.current = true;
    void initializeSession();
  }, []);

  async function initializeSession() {
    try {
      setPendingLabel("Opening demo session");
      const response = await fetch("/api/sessions", { method: "POST" });
      const data = await readJsonOrThrow<CreateSessionResponseDto>(response);
      startTransition(() => {
        setSessionId(data.sessionId);
        setStep(data.step);
        setFacts(data.facts);
        setUi(data.ui);
        setMessages([
          {
            id: messageId(),
            role: "assistant",
            content: buildIntroMessage(),
          },
        ]);
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to initialize the session.");
    } finally {
      setPendingLabel(null);
    }
  }

  function applySessionUpdate(payload: {
    step: SessionStep;
    facts: SessionFacts;
    ui: RenderableSessionUi;
  }) {
    startTransition(() => {
      setStep(payload.step);
      setFacts(payload.facts);
      setUi(payload.ui);
    });
  }

  async function sendChat(
    payload: Omit<ChatMessageRequestDto, "sessionId">,
    options?: {
      userMessage?: string;
    },
  ) {
    if (!sessionId) {
      return;
    }

    setError(null);
    const visibleUserMessage = options?.userMessage ?? payload.content;

    if (visibleUserMessage.trim()) {
      setMessages((current) => [
        ...current,
        { id: messageId(), role: "user", content: visibleUserMessage },
      ]);
    }

    try {
      setPendingLabel("Updating guided reply");
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          sessionId,
        } satisfies ChatMessageRequestDto),
      });

      const data = await readJsonOrThrow<ChatMessageResponseDto>(response);
      applySessionUpdate(data);
      setMessages((current) => [
        ...current,
        {
          id: messageId(),
          role: "assistant",
          content: data.assistantMessage,
        },
      ]);
      setDraft("");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Message failed.");
    } finally {
      setPendingLabel(null);
    }
  }

  async function handleUpload(file: File) {
    if (!sessionId) {
      return;
    }

    try {
      setPendingLabel("Uploading and analyzing statement");
      setError(null);

      const formData = new FormData();
      formData.set("sessionId", sessionId);
      formData.set("file", file);

      const uploadResponse = await fetch("/api/bills/upload", {
        method: "POST",
        body: formData,
      });
      const uploaded = await readJsonOrThrow<UploadBillResponseDto>(uploadResponse);

      const processResponse = await fetch(
        `/api/bills/${uploaded.uploadedBillId}/process`,
        { method: "POST" },
      );
      const processed = await readJsonOrThrow<ProcessBillResponseDto>(processResponse);
      applySessionUpdate(processed);

      await sendChat(
        {
          content: "I uploaded the itemized statement.",
        },
        {
          userMessage: `Uploaded ${file.name}`,
        },
      );
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Upload failed.");
      setPendingLabel(null);
    }
  }

  function renderActionPanel() {
    switch (step) {
      case "NEW":
      case "INTAKE":
        return (
          <IntakePanel
            facts={facts}
            draft={draft}
            onDraftChange={setDraft}
            onSubmitDraft={() => sendChat({ content: draft })}
            onQuickStart={() =>
              sendChat({
                content: "Oh no, I got a very large hospital bill for about $6000.",
                factPatch: {
                  estimatedBillTotal: 6000,
                },
              })
            }
            onSelectHospital={(hospitalName) =>
              sendChat({
                content: hospitalName,
                factPatch: { hospitalName },
              })
            }
            onSelectInsurance={(hasInsurance) =>
              sendChat({
                content: hasInsurance ? "I have insurance." : "No, I do not have insurance.",
                factPatch: { hasInsurance },
              })
            }
            pending={Boolean(pendingLabel)}
          />
        );
      case "AWAITING_BILL_UPLOAD":
      case "BILL_UPLOADED":
      case "BILL_PARSED":
        return (
          <UploadPanel
            pending={Boolean(pendingLabel)}
            onUpload={handleUpload}
            onAskWhatIsItemized={() =>
              sendChat({
                content: "What is an itemized statement?",
              })
            }
            onConfirmRequested={() =>
              sendChat({
                content: "I called the hospital and requested the itemized statement.",
              })
            }
          />
        );
      case "BILL_ANALYZED":
      case "AWAITING_INCOME":
        return (
          <IncomePanel
            pending={Boolean(pendingLabel)}
            incomeAmount={incomeAmount}
            onIncomeAmountChange={setIncomeAmount}
            onBracketSelect={(incomeBracket) =>
              sendChat({
                content: `My household income is in the ${incomeBracket} bracket.`,
                incomeInput: { incomeBracket },
              })
            }
            onAmountSubmit={() =>
              sendChat({
                content: `My household income is ${incomeAmount}.`,
                incomeInput: {
                  incomeAmount: Number(incomeAmount),
                },
              })
            }
          />
        );
      case "STRATEGY_READY":
      case "NEGOTIATION_IN_PROGRESS":
        return (
          <OutcomePanel
            pending={Boolean(pendingLabel)}
            reducedAmount={resolutionAmount}
            notes={resolutionNotes}
            onReducedAmountChange={setResolutionAmount}
            onNotesChange={setResolutionNotes}
            onSubmitOutcome={(input) =>
              sendChat({
                content: input.content,
                resolutionInput: {
                  reducedAmount: input.reducedAmount ?? null,
                  resolutionType: input.resolutionType,
                  notes: input.notes ?? null,
                },
              })
            }
          />
        );
      case "RESOLUTION_RECORDED":
        return (
          <ResolutionFollowUpPanel
            pending={Boolean(pendingLabel)}
            onPaymentPlanHelp={() =>
              sendChat({
                content: "Help me negotiate a payment plan for the remaining balance.",
              })
            }
            onCloseCase={() =>
              sendChat({
                content: "No, case closed.",
              })
            }
          />
        );
      case "COMPLETE":
        return (
          <Card className="border-0 bg-[#f0f8f1] ring-1 ring-[#c2dec6]">
            <CardHeader>
              <CardTitle className="text-[#1b5b2d]">Case closed</CardTitle>
              <CardDescription>
                This demo session is complete. Start a new one if you want to replay another scenario.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="rounded-full bg-[#1b5b2d] px-5 text-white hover:bg-[#144722]"
                onClick={() => {
                  initializedRef.current = false;
                  setMessages([]);
                  setDraft("");
                  void initializeSession();
                }}
              >
                Start a fresh demo
              </Button>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(252,221,170,0.75),transparent_28%),radial-gradient(circle_at_top_right,rgba(113,189,197,0.32),transparent_24%),linear-gradient(180deg,#fff8ee_0%,#f4fbfb_54%,#f0f6ff_100%)]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_0,rgba(12,58,63,0.05)_1px,transparent_1px)] bg-[size:100%_42px]" />
      <main className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_380px]">
          <Card className="border-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(244,251,251,0.96))] shadow-[0_30px_100px_rgba(15,55,64,0.16)] ring-1 ring-[#d9eaed]">
            <CardHeader className="gap-5 border-b border-[#d9eaed] bg-[linear-gradient(135deg,#103c44,#0b545c)] text-white">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="max-w-2xl">
                  <Badge variant="secondary" className="mb-3 bg-white/12 text-white ring-1 ring-white/18">
                    Hackathon demo workflow
                  </Badge>
                  <CardTitle className="text-3xl leading-tight text-white sm:text-4xl">
                    Aether
                  </CardTitle>
                  <CardDescription className="mt-2 max-w-xl text-[0.95rem] text-teal-100/80">
                    Guided, stateful, and deterministic. The UI only reveals the next approved action while the backend controls the workflow.
                  </CardDescription>
                </div>
                <div className="grid gap-2 rounded-[28px] bg-white/10 p-4 text-sm text-teal-50 ring-1 ring-white/12">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-teal-100/75">Current lane</span>
                    <span className="font-medium">{guidedLabel(step, facts)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-teal-100/75">Estimated balance</span>
                    <span className="font-medium">{formatCaseMoney(facts.estimatedBillTotal)}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-6 p-4 sm:p-5">
              <div className="min-h-[380px] space-y-4 rounded-[30px] bg-[#fbfefd] p-3 ring-1 ring-[#dae9ec] sm:p-4">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                {pendingLabel ? (
                  <div className="mr-auto flex max-w-[88%] items-center gap-2 rounded-[28px] bg-[#14373c] px-4 py-3 text-sm text-white ring-1 ring-white/10">
                    <LoaderCircle className="size-4 animate-spin" />
                    {pendingLabel}
                  </div>
                ) : null}
                <div ref={bottomRef} />
              </div>

              {error ? (
                <div className="rounded-[24px] border border-[#efb0a9] bg-[#fff1ef] px-4 py-3 text-sm text-[#a53a2c]">
                  {error}
                </div>
              ) : null}

              {renderActionPanel()}

              <Card className="border-0 bg-[#f8fafb] ring-1 ring-[#dfe9eb]">
                <CardHeader>
                  <CardTitle className="text-[#18353c]">Freeform fallback</CardTitle>
                  <CardDescription>
                    The guided controls are primary, but you can still send a custom chat message to drive the demo.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Type a custom reply if you want to nudge the session manually."
                    className="min-h-24 border-[#cfdee1] bg-white"
                  />
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-xs uppercase tracking-[0.18em] text-[#5a7b81]">
                      Session {sessionId ? sessionId.slice(-6) : "loading"}
                    </div>
                    <Button
                      disabled={Boolean(pendingLabel) || !draft.trim()}
                      onClick={() => sendChat({ content: draft })}
                      className="h-10 rounded-full bg-[#103c44] px-5 text-white hover:bg-[#0a2c31]"
                    >
                      Send manual reply
                      <ArrowUpRight className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          <CliniqCaseCards
            facts={facts}
            step={step}
            ui={ui}
            isOpen={casePanelOpen}
            onToggle={() => setCasePanelOpen((current) => !current)}
          />
        </section>
      </main>
    </div>
  );
}
