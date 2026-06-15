"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Upload, FileText, Loader2, X, ExternalLink, Sparkles } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Markdown } from "@/components/markdown";
import { AiChat } from "@/components/public/ai-chat";
import { AiDisclaimer } from "@/components/public/ai-disclaimer";
import { ACCEPTED_DOC_TYPES, type AiModeKey } from "@/lib/ai/config";
import { cn } from "@/lib/utils";
import type {
  ResumeResult,
  JobMatchResult,
  InterviewResult,
  LearningResult,
} from "@/lib/ai/career";

type Tool<T> = { object: T } | { fallbackMarkdown: string };

const CLIENT_KEY = "pc_ai_client";
const RESUME_KEY = "pc_copilot_resume";

const INTERVIEW_ROLES = [
  "Pharmacist",
  "Medical Representative",
  "Clinical Pharmacist",
  "Hospital Pharmacist",
  "Pharmacovigilance Associate",
  "Production / QA Pharmacist",
];

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function callTool<T>(url: string, body: object): Promise<Tool<T>> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Tool<T> & { error?: string };
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export function CareerCopilot({
  enabled,
  availableModes,
  imageEnabled,
  documentEnabled,
  careerEnabled,
  maxImageMB,
  maxDocMB,
}: {
  enabled: boolean;
  availableModes: AiModeKey[];
  imageEnabled: boolean;
  documentEnabled: boolean;
  careerEnabled: boolean;
  maxImageMB: number;
  maxDocMB: number;
}) {
  const [clientId, setClientId] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [resumeName, setResumeName] = useState("");
  const [resumeBusy, setResumeBusy] = useState(false);
  const resumeFileRef = useRef<HTMLInputElement | null>(null);

  const [resume, setResume] = useState<{ loading: boolean; result?: Tool<ResumeResult> }>({ loading: false });
  const [jobs, setJobs] = useState<{ loading: boolean; result?: Tool<JobMatchResult> }>({ loading: false });
  const [role, setRole] = useState(INTERVIEW_ROLES[0]);
  const [interview, setInterview] = useState<{ loading: boolean; result?: Tool<InterviewResult> }>({ loading: false });
  const [goal, setGoal] = useState("");
  const [learn, setLearn] = useState<{ loading: boolean; result?: Tool<LearningResult> }>({ loading: false });

  useEffect(() => {
    let id = localStorage.getItem(CLIENT_KEY);
    if (!id) {
      id = newId();
      localStorage.setItem(CLIENT_KEY, id);
    }
    setClientId(id);
    try {
      const raw = sessionStorage.getItem(RESUME_KEY);
      if (raw) {
        const s = JSON.parse(raw) as { text?: string; name?: string };
        if (s.text) setResumeText(s.text);
        if (s.name) setResumeName(s.name);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!clientId) return;
    try {
      sessionStorage.setItem(RESUME_KEY, JSON.stringify({ text: resumeText, name: resumeName }));
    } catch {
      /* ignore */
    }
  }, [resumeText, resumeName, clientId]);

  async function onResumeFile(file: File) {
    if (!ACCEPTED_DOC_TYPES.includes(file.type)) {
      toast.error("Use a PDF, DOCX, or TXT file.");
      return;
    }
    if (file.size > maxDocMB * 1024 * 1024) {
      toast.error(`File too large (max ${maxDocMB} MB).`);
      return;
    }
    setResumeBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/ai/extract", { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as { text?: string; name?: string; error?: string };
      if (!res.ok || !data.text) throw new Error(data.error || "Could not read the file.");
      setResumeText(data.text);
      setResumeName(data.name || file.name);
      toast.success("Résumé loaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not read the file.");
    } finally {
      setResumeBusy(false);
    }
  }

  const hasResume = resumeText.trim().length >= 50;

  async function runResume() {
    if (!hasResume) return toast.error("Add your résumé first (upload or paste).");
    setResume({ loading: true });
    try {
      setResume({ loading: false, result: await callTool<ResumeResult>("/api/ai/career/resume", { clientId, resumeText }) });
    } catch (e) {
      setResume({ loading: false });
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  async function runJobs() {
    if (!hasResume) return toast.error("Add your résumé first (Résumé tab).");
    setJobs({ loading: true });
    try {
      setJobs({ loading: false, result: await callTool<JobMatchResult>("/api/ai/career/job-match", { clientId, resumeText }) });
    } catch (e) {
      setJobs({ loading: false });
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  async function runInterview() {
    setInterview({ loading: true });
    try {
      setInterview({ loading: false, result: await callTool<InterviewResult>("/api/ai/career/interview", { clientId, role }) });
    } catch (e) {
      setInterview({ loading: false });
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  async function runLearn() {
    if (goal.trim().length < 2) return toast.error("Tell us your goal first.");
    setLearn({ loading: true });
    try {
      setLearn({
        loading: false,
        result: await callTool<LearningResult>("/api/ai/career/recommend", {
          clientId,
          goal,
          resumeText: hasResume ? resumeText : undefined,
        }),
      });
    } catch (e) {
      setLearn({ loading: false });
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  if (!enabled) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
        The Career Copilot is currently unavailable. Please check back later.
      </div>
    );
  }

  const tabs: { value: string; label: string }[] = [
    { value: "chat", label: "Chat" },
    ...(careerEnabled ? [{ value: "resume", label: "Résumé" }] : []),
    ...(careerEnabled ? [{ value: "jobs", label: "Job Match" }] : []),
    ...(careerEnabled ? [{ value: "interview", label: "Interview" }] : []),
    { value: "study", label: "Study" },
    ...(careerEnabled ? [{ value: "learn", label: "Learn" }] : []),
  ];

  return (
    <Tabs defaultValue="chat" className="w-full">
      <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
        {tabs.map((t) => (
          <TabsTrigger key={t.value} value={t.value}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Chat */}
      <TabsContent value="chat">
        <div className="rounded-xl border bg-card p-3 sm:p-4">
          <div className="h-[62vh]">
            <AiChat
              enabled={enabled}
              availableModes={availableModes}
              imageEnabled={imageEnabled}
              documentEnabled={documentEnabled}
              maxImageMB={maxImageMB}
              maxDocMB={maxDocMB}
            />
          </div>
        </div>
      </TabsContent>

      {/* Study (chat in STUDENT mode, separate history) */}
      <TabsContent value="study">
        <p className="mb-2 text-sm text-muted-foreground">
          Upload your notes/PDF and ask for summaries, explanations, MCQs, or flashcards.
        </p>
        <div className="rounded-xl border bg-card p-3 sm:p-4">
          <div className="h-[62vh]">
            <AiChat
              enabled={enabled}
              availableModes={availableModes}
              defaultMode="STUDENT"
              storageNamespace="study"
              imageEnabled={imageEnabled}
              documentEnabled={documentEnabled}
              maxImageMB={maxImageMB}
              maxDocMB={maxDocMB}
            />
          </div>
        </div>
      </TabsContent>

      {careerEnabled && (
        <>
          {/* Résumé */}
          <TabsContent value="resume">
            <Card>
              <CardContent className="space-y-4 p-4">
                <ResumeInput
                  resumeName={resumeName}
                  resumeText={resumeText}
                  busy={resumeBusy}
                  onText={setResumeText}
                  onPick={() => resumeFileRef.current?.click()}
                  onClear={() => {
                    setResumeText("");
                    setResumeName("");
                  }}
                />
                <input
                  ref={resumeFileRef}
                  type="file"
                  accept={ACCEPTED_DOC_TYPES.join(",")}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) void onResumeFile(e.target.files[0]);
                    e.target.value = "";
                  }}
                />
                <Button onClick={runResume} disabled={resume.loading || !hasResume}>
                  {resume.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Analyze résumé
                </Button>
                <ResultPanel result={resume.result}>
                  {(r: ResumeResult) => (
                    <div className="space-y-4">
                      <ScoreBar value={r.score} label="Résumé score" />
                      {r.summary && <p className="text-sm text-muted-foreground">{r.summary}</p>}
                      <Bullets title="Strengths" items={r.strengths} />
                      <div>
                        <h4 className="mb-1 text-sm font-semibold">Missing skills / keywords</h4>
                        <Chips items={r.missingSkills} variant="bad" />
                      </div>
                      <Bullets title="Improvements" items={r.improvements} />
                      <Bullets title="ATS tips" items={r.atsTips} />
                    </div>
                  )}
                </ResultPanel>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Job Match */}
          <TabsContent value="jobs">
            <Card>
              <CardContent className="space-y-4 p-4">
                <ResumeBadge resumeName={resumeName} hasResume={hasResume} />
                <Button onClick={runJobs} disabled={jobs.loading || !hasResume}>
                  {jobs.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Match me to jobs
                </Button>
                <ResultPanel result={jobs.result}>
                  {(r: JobMatchResult) => (
                    <div className="space-y-4">
                      {r.overall && <p className="text-sm text-muted-foreground">{r.overall}</p>}
                      {r.matches.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No strong matches found.</p>
                      ) : (
                        r.matches.map((m) => (
                          <div key={m.slug} className="rounded-lg border p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <Link href={`/jobs/${m.slug}`} className="font-semibold hover:text-primary">
                                  {m.title}
                                </Link>
                                <p className="text-xs text-muted-foreground">{m.company}</p>
                              </div>
                              <span className="shrink-0 text-sm font-bold text-primary">{m.matchPercent}%</span>
                            </div>
                            <div className="mt-2">
                              <ScoreBar value={m.matchPercent} />
                            </div>
                            {m.why && <p className="mt-2 text-sm text-muted-foreground">{m.why}</p>}
                            {m.missingSkills.length > 0 && (
                              <div className="mt-2">
                                <Chips items={m.missingSkills} variant="bad" />
                              </div>
                            )}
                            <Link
                              href={`/jobs/${m.slug}`}
                              className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                            >
                              View job <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </ResultPanel>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Interview */}
          <TabsContent value="interview">
            <Card>
              <CardContent className="space-y-4 p-4">
                <div className="flex flex-wrap items-end gap-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Role</label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger className="w-[260px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INTERVIEW_ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={runInterview} disabled={interview.loading}>
                    {interview.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Generate questions
                  </Button>
                </div>
                <ResultPanel result={interview.result}>
                  {(r: InterviewResult) => (
                    <div className="space-y-3">
                      {r.questions.map((q, i) => (
                        <div key={i} className="rounded-lg border p-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium">{q.question}</p>
                            <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                              {q.category}
                            </span>
                          </div>
                          {q.answerOutline && (
                            <p className="mt-1.5 text-sm text-muted-foreground">{q.answerOutline}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ResultPanel>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Learn */}
          <TabsContent value="learn">
            <Card>
              <CardContent className="space-y-4 p-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Your goal</label>
                  <Input
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g. Become a clinical pharmacist / crack GPAT / move into pharmacovigilance"
                  />
                </div>
                <ResumeBadge resumeName={resumeName} hasResume={hasResume} optional />
                <Button onClick={runLearn} disabled={learn.loading}>
                  {learn.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Get my learning plan
                </Button>
                <ResultPanel result={learn.result}>
                  {(r: LearningResult) => (
                    <div className="space-y-4">
                      {r.focusAreas.length > 0 && (
                        <div>
                          <h4 className="mb-1 text-sm font-semibold">Focus areas</h4>
                          <Chips items={r.focusAreas} />
                        </div>
                      )}
                      {r.topics.length > 0 && (
                        <div>
                          <h4 className="mb-1 text-sm font-semibold">Topics</h4>
                          <ul className="space-y-1.5 text-sm">
                            {r.topics.map((t, i) => (
                              <li key={i}>
                                <span className="font-medium">{t.topic}</span>
                                <span className="text-muted-foreground"> — {t.why}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {r.posts.length > 0 && (
                        <div>
                          <h4 className="mb-1 text-sm font-semibold">Recommended reading</h4>
                          <ul className="space-y-1.5 text-sm">
                            {r.posts.map((p, i) => (
                              <li key={i}>
                                {p.slug ? (
                                  <Link href={`/articles/${p.slug}`} className="text-primary hover:underline">
                                    {p.title}
                                  </Link>
                                ) : (
                                  <span>{p.title}</span>
                                )}
                                {p.reason && <span className="text-muted-foreground"> — {p.reason}</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </ResultPanel>
              </CardContent>
            </Card>
          </TabsContent>
        </>
      )}

      <AiDisclaimer className="mt-3" />
    </Tabs>
  );
}

function ResumeInput({
  resumeName,
  resumeText,
  busy,
  onText,
  onPick,
  onClear,
}: {
  resumeName: string;
  resumeText: string;
  busy: boolean;
  onText: (v: string) => void;
  onPick: () => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onPick} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload PDF / DOCX / TXT
        </Button>
        {resumeName && (
          <span className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs">
            <FileText className="h-3.5 w-3.5" /> {resumeName}
            <button type="button" onClick={onClear} aria-label="Remove résumé">
              <X className="h-3 w-3" />
            </button>
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">…or paste your résumé text:</p>
      <Textarea
        value={resumeText}
        onChange={(e) => onText(e.target.value)}
        rows={6}
        placeholder="Paste your résumé here…"
      />
    </div>
  );
}

function ResumeBadge({
  resumeName,
  hasResume,
  optional,
}: {
  resumeName: string;
  hasResume: boolean;
  optional?: boolean;
}) {
  return (
    <p className="text-sm text-muted-foreground">
      {hasResume ? (
        <span className="flex items-center gap-1.5">
          <FileText className="h-4 w-4" /> Using your résumé{resumeName ? `: ${resumeName}` : ""}
        </span>
      ) : optional ? (
        "Tip: add your résumé in the Résumé tab for more personalized results."
      ) : (
        "Add your résumé in the Résumé tab first (upload or paste)."
      )}
    </p>
  );
}

function ResultPanel<T>({
  result,
  children,
}: {
  result?: Tool<T>;
  children: (object: T) => React.ReactNode;
}) {
  if (!result) return null;
  if ("fallbackMarkdown" in result) {
    return (
      <div className="rounded-lg border bg-muted/30 p-3">
        <Markdown content={result.fallbackMarkdown} className="text-sm" />
      </div>
    );
  }
  return <div className="rounded-lg border bg-muted/30 p-3">{children(result.object)}</div>;
}

function ScoreBar({ value, label }: { value: number; label?: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div>
      {label && (
        <div className="mb-1 flex justify-between text-xs">
          <span className="font-medium">{label}</span>
          <span className="font-semibold">{v}%</span>
        </div>
      )}
      <div className="h-2 w-full rounded-full bg-muted">
        <div className="h-2 rounded-full bg-primary" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

function Chips({ items, variant }: { items: string[]; variant?: "good" | "bad" }) {
  if (!items?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((s, i) => (
        <span
          key={i}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs",
            variant === "bad" ? "bg-destructive/10 text-destructive" : "bg-accent text-accent-foreground",
          )}
        >
          {s}
        </span>
      ))}
    </div>
  );
}

function Bullets({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <h4 className="mb-1 text-sm font-semibold">{title}</h4>
      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        {items.map((x, i) => (
          <li key={i}>{x}</li>
        ))}
      </ul>
    </div>
  );
}
