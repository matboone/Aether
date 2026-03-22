"use client";

import { ChevronDown, ChevronUp, Phone, ReceiptText, ShieldAlert, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { RenderableSessionUi, SessionFacts, SessionStep } from "@/src/types/domain";

function formatMoney(value?: number | null) {
  if (typeof value !== "number") {
    return "Not available";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function CliniqCaseCards({
  facts,
  step,
  ui,
  isOpen,
  onToggle,
}: {
  facts: SessionFacts;
  step: SessionStep;
  ui: RenderableSessionUi;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <aside className="flex h-fit flex-col gap-4 lg:sticky lg:top-6">
      <Card className="overflow-hidden border-0 bg-[#cfe6bd] text-[#232634] shadow-[0_30px_80px_rgba(35,38,52,0.16)] ring-1 ring-[#9fc381]">
        <CardHeader className="gap-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge className="mb-3 bg-white/75 text-[#232634] ring-1 ring-[#8fb873]" variant="secondary">
                Live case file
              </Badge>
              <CardTitle className="text-xl text-[#232634]">
                Aether
              </CardTitle>
              <CardDescription className="mt-1 text-[#334155]">
                Backend-driven demo state with progressive reveal panels.
              </CardDescription>
            </div>
            <Button
              size="icon-sm"
              variant="secondary"
              className="bg-white/70 text-[#232634] hover:bg-white"
              onClick={onToggle}
            >
              {isOpen ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-[#8fb873] bg-white/70 text-[#232634]">
              Step: {step}
            </Badge>
            <Badge variant="outline" className="border-[#8fb873] bg-white/70 text-[#232634]">
              Hospital: {facts.hospitalName ?? "Pending"}
            </Badge>
          </div>
        </CardHeader>
        {isOpen ? (
          <CardContent className="flex flex-col gap-4">
            <Card className="border-0 bg-white/75 text-[#232634] shadow-none ring-1 ring-[#9fc381]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#232634]">
                  <ReceiptText className="size-4 text-[#6f9e52]" />
                  Case snapshot
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm text-[#334155]">
                <div className="flex justify-between gap-3">
                  <span>Estimated total</span>
                  <span>{formatMoney(facts.estimatedBillTotal)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Insurance</span>
                  <span>
                    {facts.hasInsurance === null || facts.hasInsurance === undefined
                      ? "Pending"
                      : facts.hasInsurance
                        ? "Has insurance"
                        : "No insurance"}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Income bracket</span>
                  <span>{facts.incomeBracket ?? "Pending"}</span>
                </div>
              </CardContent>
            </Card>

            {ui.analysisSummary ? (
              <Card className="border-0 bg-[#fff7ec] text-[#3b3024] shadow-none ring-1 ring-[#f0c58b]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#2b2117]">
                    <ShieldAlert className="size-4 text-[#c96a15]" />
                    Bill analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <span>Original total</span>
                      <strong>{formatMoney(ui.analysisSummary.originalTotal)}</strong>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span>Flagged items</span>
                      <strong>{ui.analysisSummary.flaggedCount}</strong>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span>Possible overcharge</span>
                      <strong>{formatMoney(ui.analysisSummary.estimatedOvercharge)}</strong>
                    </div>
                  </div>
                  {ui.flaggedItems?.length ? (
                    <div className="space-y-3">
                      <Separator />
                      {ui.flaggedItems.slice(0, 3).map((item) => (
                        <div key={`${item.label}-${item.chargedAmount}`} className="rounded-2xl bg-white/70 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-medium">{item.label}</div>
                              <div className="mt-1 text-xs text-[#7f6651]">
                                Fair range {formatMoney(item.fairRangeLow)} to {formatMoney(item.fairRangeHigh)}
                              </div>
                            </div>
                            <Badge variant="outline" className="border-[#e7b57e] bg-[#fff2df] text-[#8b4d13]">
                              {item.severity}
                            </Badge>
                          </div>
                          <div className="mt-2 flex justify-between gap-3 text-xs">
                            <span>Charged {formatMoney(item.chargedAmount)}</span>
                            <span>Benchmark {formatMoney(item.benchmarkAmount)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            {ui.hospitalStrategy ? (
              <Card className="border-0 bg-[#f2f7f7] shadow-none ring-1 ring-[#b7d6d9]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#11363d]">
                    <Phone className="size-4 text-[#0b545c]" />
                    Hospital strategy
                  </CardTitle>
                  <CardDescription>
                    {ui.hospitalStrategy.canonicalName}
                    {ui.hospitalStrategy.phoneNumber
                      ? ` · ${ui.hospitalStrategy.phoneNumber}`
                      : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-[#24484d]">
                  {ui.hospitalStrategy.recommendedSteps.slice(0, 3).map((stepItem) => (
                    <div key={stepItem} className="rounded-2xl bg-white p-3 ring-1 ring-[#d3e5e7]">
                      {stepItem}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}

            {ui.negotiationPlan ? (
              <Card className="border-0 bg-[#f5f0ff] shadow-none ring-1 ring-[#d9c9ff]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#40206f]">
                    <Sparkles className="size-4 text-[#7d4ce5]" />
                    Negotiation plan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-[#4c3379]">
                  {ui.negotiationPlan.nextActions.slice(0, 3).map((action) => (
                    <div key={action} className="rounded-2xl bg-white p-3 ring-1 ring-[#e6dbff]">
                      {action}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}

            {ui.resolutionSummary ? (
              <Card className="border-0 bg-[#eef9f1] shadow-none ring-1 ring-[#b6dfc0]">
                <CardHeader>
                  <CardTitle className="text-[#1e5a2f]">Resolution</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm text-[#1e5a2f]">
                  <div className="flex justify-between gap-3">
                    <span>Original balance</span>
                    <strong>{formatMoney(ui.resolutionSummary.originalAmount)}</strong>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Reduced balance</span>
                    <strong>{formatMoney(ui.resolutionSummary.reducedAmount)}</strong>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span>Savings</span>
                    <strong>{formatMoney(ui.resolutionSummary.savingsAmount)}</strong>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </CardContent>
        ) : null}
      </Card>
    </aside>
  );
}

export function formatCaseMoney(value?: number | null) {
  return formatMoney(value);
}
