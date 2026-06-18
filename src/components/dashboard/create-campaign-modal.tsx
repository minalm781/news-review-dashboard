"use client";

import { ChevronRight, Info, Pencil, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ArticleDto } from "@/types/api";

// ─── Static config ────────────────────────────────────────────────────────────

const TEAMS = [
  "QA Team",
  "Team Kunal O&O",
  "Team PTP",
  "Team AI Bing",
  "Mobile Apps",
  "Team AI RS4C",
  "Team Zephyr",
];

const TRAFFIC_ROUTES = [
  { label: "Facebook → Ginsu", source: "Facebook", lander: "Ginsu" },
  { label: "Google → Ginsu", source: "Google", lander: "Ginsu" },
  { label: "Facebook → RS4C", source: "Facebook", lander: "RS4C" },
  { label: "Taboola → Ginsu", source: "Taboola", lander: "Ginsu" },
];

const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Italy",
  "Spain",
  "Netherlands",
  "Sweden",
];

const LANGUAGES = ["EN", "DE", "FR", "IT", "SV", "ES", "NL", "PT", "JP"];
const MEDIA_TYPES = ["VIDEO", "IMAGE"];
const CLICK_MODELS = ["2C", "3C"];
const LANDER_TYPES = ["SERP"];
const CAMPAIGN_STATUSES = ["ACTIVE", "PAUSED", "DRAFT"];
const CAMPAIGN_LAUNCH_SETTINGS = [
  "GINSU_2C_TCPA_MB_US",
  "GINSU_2C_SMART_MB_US-0.28",
  "GINSU_2C_SMART_MB_US-0.25",
  "GINSU_2C_MAX_CONV_TB_US",
  "GINSU_2C_SMART_MB_US-0.35",
  "GINSU_2C_SMART_TB_US-0.35",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateBatchName(source: string, lander: string): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  const ts = Math.floor(Date.now() / 1000);
  return `${dd}-${mm}-${yyyy}_${source}_${lander}_${ts}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepAccordion({
  number,
  title,
  description,
  isOpen,
  isComplete,
  summary,
  onToggle,
  children,
}: {
  number: number;
  title: string;
  description: string;
  isOpen: boolean;
  isComplete: boolean;
  summary: string[];
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-b border-gray-100">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-gray-50"
      >
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
            isOpen
              ? "bg-blue-600 text-white"
              : isComplete
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-500"
          }`}
        >
          {number}
        </span>
        <div className="flex-1 text-left">
          <p className="font-medium text-gray-900">{title}</p>
          {!isOpen && summary.length > 0 ? (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {summary.map((s) => (
                <span
                  key={s}
                  className="rounded border border-gray-200 bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600"
                >
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">{description}</p>
          )}
        </div>
        <ChevronRight
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-90" : ""}`}
        />
      </button>
      {isOpen && <div className="border-t border-gray-100">{children}</div>}
    </div>
  );
}

function OverviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-blue-500 bg-blue-50 text-blue-700"
          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
      }`}
    >
      {children}
    </button>
  );
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormData {
  team: string;
  trafficRoute: string;
  campaignType: string;
  clickModel: string;
  landerType: string;
  country: string;
  language: string;
  mediaType: string;
  useCustomLanderUrl: boolean;
  smartAllocation: boolean;
  concepts: string;
  campaignLaunchSettings: string;
  campaignStartDate: string;
  campaignBudget: string;
  campaignTags: string;
  campaignStatus: string;
}

const DEFAULT_FORM: FormData = {
  team: "",
  trafficRoute: "",
  campaignType: "Native",
  clickModel: "2C",
  landerType: "SERP",
  country: "United States",
  language: "EN",
  mediaType: "VIDEO",
  useCustomLanderUrl: false,
  smartAllocation: false,
  concepts: "",
  campaignLaunchSettings: "",
  campaignStartDate: "",
  campaignBudget: "",
  campaignTags: "",
  campaignStatus: "ACTIVE",
};

// ─── Main modal ───────────────────────────────────────────────────────────────

interface CreateCampaignModalProps {
  article: ArticleDto | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateCampaignModal({
  article,
  onClose,
  onSuccess,
}: CreateCampaignModalProps) {
  const [activeStep, setActiveStep] = useState(1);
  const [batchName, setBatchName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [batchCreated, setBatchCreated] = useState(false);
  const [error, setError] = useState("");

  // Auto-generate batch name from traffic route
  useEffect(() => {
    const route = TRAFFIC_ROUTES.find((r) => r.label === form.trafficRoute);
    if (route) {
      setBatchName(generateBatchName(route.source, route.lander));
    }
  }, [form.trafficRoute]);

  useEffect(() => {
    setBatchName(generateBatchName("Taboola", "Ginsu"));
  }, []);

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const step1Complete = Boolean(form.team && form.trafficRoute);
  const step2Complete = Boolean(
    form.clickModel && form.landerType && form.country && form.language && form.mediaType,
  );

  async function handleCreateBatch() {
    if (!article) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/campaign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId: article.id,
          batchName,
          ...form,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to create batch");
      }

      setBatchCreated(true);
      setActiveStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit() {
    onSuccess();
    onClose();
  }

  function handleReset() {
    setForm(DEFAULT_FORM);
    setActiveStep(1);
    setBatchCreated(false);
    setError("");
    setBatchName(generateBatchName("Taboola", "Ginsu"));
  }

  if (!article) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex bg-black/40"
      onClick={onClose}
    >
      {/* Slide-over panel from right */}
      <div className="ml-auto flex h-full w-full max-w-3xl flex-col bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={onClose}
              className="mt-0.5 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-500">Batch Name :</span>
                {editingName ? (
                  <input
                    autoFocus
                    className="border-b border-blue-500 text-sm font-semibold text-gray-900 outline-none"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    onBlur={() => setEditingName(false)}
                    onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
                  />
                ) : (
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 hover:text-blue-600"
                    onClick={() => setEditingName(true)}
                  >
                    {batchName}
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="mt-0.5 text-xs text-gray-400">
                Build campaign batches in 4 simple steps
              </p>
            </div>
          </div>
          <Info className="mt-1 h-4 w-4 text-gray-400" />
        </div>

        {/* ── Steps ── */}
        <div className="flex-1 overflow-y-auto">

          {/* Step 1 — Batch Details */}
          <StepAccordion
            number={1}
            title="Batch Details"
            description="Define key details for your campaign batch."
            isOpen={activeStep === 1}
            isComplete={step1Complete && activeStep !== 1}
            summary={
              step1Complete && activeStep !== 1
                ? [form.team, form.trafficRoute, form.campaignType.toUpperCase()]
                : []
            }
            onToggle={() => setActiveStep(activeStep === 1 ? 0 : 1)}
          >
            <div className="grid grid-cols-3 gap-5 px-6 py-5">
              {/* Team */}
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
                  Team <Info className="h-3.5 w-3.5 text-gray-400" />
                </label>
                <Select value={form.team} onValueChange={(v) => update("team", v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEAMS.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Traffic Route */}
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
                  Traffic Route <Info className="h-3.5 w-3.5 text-gray-400" />
                </label>
                <Select value={form.trafficRoute} onValueChange={(v) => update("trafficRoute", v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select route" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRAFFIC_ROUTES.map((r) => (
                      <SelectItem key={r.label} value={r.label}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Campaign Type */}
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
                  Campaign Type <Info className="h-3.5 w-3.5 text-gray-400" />
                </label>
                <div className="flex gap-2">
                  <ToggleButton
                    active={form.campaignType === "Native"}
                    onClick={() => update("campaignType", "Native")}
                  >
                    Native
                  </ToggleButton>
                </div>
              </div>
            </div>

            {step1Complete && (
              <div className="flex justify-end px-6 pb-5">
                <Button size="sm" onClick={() => setActiveStep(2)}>
                  Continue <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            )}
          </StepAccordion>

          {/* Step 2 — Creative & Lander Settings */}
          <StepAccordion
            number={2}
            title="Creative & Lander Settings"
            description="Configure ad creatives and landing page settings."
            isOpen={activeStep === 2}
            isComplete={step2Complete && activeStep > 2}
            summary={
              step2Complete && activeStep > 2
                ? [form.landerType, form.language, form.mediaType, form.clickModel]
                : []
            }
            onToggle={() => setActiveStep(activeStep === 2 ? 0 : 2)}
          >
            <div className="space-y-5 px-6 py-5">
              <div className="grid grid-cols-2 gap-6">
                {/* Click Model */}
                <div>
                  <label className="mb-2 flex items-center gap-1 text-sm font-medium text-gray-700">
                    Click Model <Info className="h-3.5 w-3.5 text-gray-400" />
                  </label>
                  <div className="flex gap-2">
                    {CLICK_MODELS.map((m) => (
                      <ToggleButton
                        key={m}
                        active={form.clickModel === m}
                        onClick={() => update("clickModel", m)}
                      >
                        {m}
                      </ToggleButton>
                    ))}
                  </div>
                </div>

                {/* Lander Type */}
                <div>
                  <label className="mb-2 flex items-center gap-1 text-sm font-medium text-gray-700">
                    Lander Type <Info className="h-3.5 w-3.5 text-gray-400" />
                  </label>
                  <div className="flex gap-2">
                    {LANDER_TYPES.map((t) => (
                      <ToggleButton
                        key={t}
                        active={form.landerType === t}
                        onClick={() => update("landerType", t)}
                      >
                        {t}
                      </ToggleButton>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Country */}
                <div>
                  <label className="mb-2 flex items-center gap-1 text-sm font-medium text-gray-700">
                    Country <Info className="h-3.5 w-3.5 text-gray-400" />
                  </label>
                  <Select value={form.country} onValueChange={(v) => update("country", v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Asset Language */}
                <div>
                  <label className="mb-2 flex items-center gap-1 text-sm font-medium text-gray-700">
                    Asset Language <Info className="h-3.5 w-3.5 text-gray-400" />
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => update("language", lang)}
                        className={`rounded border px-3 py-1 text-xs font-medium transition-colors ${
                          form.language === lang
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Media Type */}
              <div>
                <label className="mb-2 flex items-center gap-1 text-sm font-medium text-gray-700">
                  Media Type <Info className="h-3.5 w-3.5 text-gray-400" />
                </label>
                <div className="flex gap-2">
                  {MEDIA_TYPES.map((m) => (
                    <ToggleButton
                      key={m}
                      active={form.mediaType === m}
                      onClick={() => update("mediaType", m)}
                    >
                      {m}
                    </ToggleButton>
                  ))}
                </div>
              </div>

              {/* Custom Lander URL */}
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.useCustomLanderUrl}
                  onChange={(e) => update("useCustomLanderUrl", e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 accent-blue-600"
                />
                <span className="flex items-center gap-1 text-sm text-gray-600">
                  Use custom lander URL
                  <Info className="h-3.5 w-3.5 text-gray-400" />
                </span>
              </label>
            </div>

            <div className="flex justify-end px-6 pb-5">
              <Button size="sm" onClick={() => setActiveStep(3)}>
                Continue <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </StepAccordion>

          {/* Step 3 — Build Your Batch */}
          <StepAccordion
            number={3}
            title="Build Your Batch"
            description="Create your batch using the editor or upload an Excel file."
            isOpen={activeStep === 3}
            isComplete={batchCreated}
            summary={batchCreated ? ["Batch created ✓"] : []}
            onToggle={() => setActiveStep(activeStep === 3 ? 0 : 3)}
          >
            <div className="space-y-5 px-6 py-5">
              {/* Smart Allocation toggle */}
              <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">+ Smart Allocation</span>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                      New
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">A smarter and faster way to create batches.</p>
                </div>
                <button
                  type="button"
                  onClick={() => update("smartAllocation", !form.smartAllocation)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    form.smartAllocation ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      form.smartAllocation ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Concepts */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Concepts
                  </label>
                  <textarea
                    className="h-44 w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter concepts here, one per line..."
                    value={form.concepts}
                    onChange={(e) => update("concepts", e.target.value)}
                  />
                </div>

                {/* Right-side campaign fields */}
                <div className="space-y-3.5">
                  <div>
                    <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
                      Campaign Launch Settings <Info className="h-3.5 w-3.5 text-gray-400" />
                    </label>
                    <Select
                      value={form.campaignLaunchSettings}
                      onValueChange={(v) => update("campaignLaunchSettings", v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select campaign launch settings" />
                      </SelectTrigger>
                      <SelectContent>
                        {CAMPAIGN_LAUNCH_SETTINGS.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
                      Campaign Start Date <Info className="h-3.5 w-3.5 text-gray-400" />
                    </label>
                    <input
                      type="date"
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={form.campaignStartDate}
                      onChange={(e) => update("campaignStartDate", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
                      Campaign Budget <Info className="h-3.5 w-3.5 text-gray-400" />
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                        $
                      </span>
                      <input
                        type="number"
                        min="0"
                        className="w-full rounded-md border border-gray-200 py-2 pl-7 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Enter budget"
                        value={form.campaignBudget}
                        onChange={(e) => update("campaignBudget", e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
                      A360 Campaign Tags <Info className="h-3.5 w-3.5 text-gray-400" />
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Enter tags separated by commas"
                      value={form.campaignTags}
                      onChange={(e) => update("campaignTags", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700">
                      Campaign Status <Info className="h-3.5 w-3.5 text-gray-400" />
                    </label>
                    <Select
                      value={form.campaignStatus}
                      onValueChange={(v) => update("campaignStatus", v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CAMPAIGN_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleCreateBatch}
                  disabled={!step1Complete || submitting || batchCreated}
                >
                  {submitting ? "Creating…" : batchCreated ? "Batch Created ✓" : "Create Batch"}
                </Button>
              </div>
            </div>
          </StepAccordion>

          {/* Step 4 — Overview */}
          <StepAccordion
            number={4}
            title="Overview"
            description="Review the created batch before final submission."
            isOpen={activeStep === 4}
            isComplete={false}
            summary={[]}
            onToggle={() => setActiveStep(activeStep === 4 ? 0 : 4)}
          >
            {batchCreated ? (
              <div className="px-6 py-5">
                <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-center">
                  <p className="text-sm font-semibold text-green-700">
                    Batch created successfully!
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-green-600">{batchName}</p>
                </div>
                <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                  <div className="px-4 py-2">
                    <OverviewRow label="Team" value={form.team} />
                    <OverviewRow label="Traffic Route" value={form.trafficRoute} />
                    <OverviewRow label="Campaign Type" value={form.campaignType} />
                  </div>
                  <div className="px-4 py-2">
                    <OverviewRow label="Click Model" value={form.clickModel} />
                    <OverviewRow label="Lander Type" value={form.landerType} />
                    <OverviewRow label="Media Type" value={form.mediaType} />
                    <OverviewRow label="Country" value={form.country} />
                    <OverviewRow label="Asset Language" value={form.language} />
                  </div>
                  <div className="px-4 py-2">
                    <OverviewRow label="Launch Settings" value={form.campaignLaunchSettings} />
                    <OverviewRow label="Campaign Status" value={form.campaignStatus} />
                    {form.campaignBudget && (
                      <OverviewRow label="Budget" value={`$${form.campaignBudget}`} />
                    )}
                    {form.campaignStartDate && (
                      <OverviewRow label="Start Date" value={form.campaignStartDate} />
                    )}
                    {form.campaignTags && (
                      <OverviewRow label="Tags" value={form.campaignTags} />
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="px-6 py-5 text-sm text-gray-400">
                Complete Steps 1–3 and create the batch to see the overview.
              </p>
            )}
          </StepAccordion>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-4">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button disabled={!batchCreated} onClick={handleSubmit}>
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}
