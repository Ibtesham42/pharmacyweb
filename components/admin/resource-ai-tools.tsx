"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Loader2, FileText, Search, Tags, ListChecks, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type {
  ExcerptResult,
  SeoResult,
  TagsResult,
  McqResult,
  FlashcardResult,
} from "@/lib/ai/resource-tools";

type Tool = "excerpt" | "seo" | "tags" | "mcqs" | "flashcards";
type ToolResult<T> = { object: T } | { fallbackMarkdown: string } | { error: string };

export interface ResourceAiSource {
  title: string;
  type: string;
  text: string;
}

interface Props {
  getSource: () => ResourceAiSource;
  attachedFile?: { id?: string; name?: string };
  onExcerpt: (excerpt: string) => void;
  onSeo: (seo: { metaTitle: string; metaDescription: string }) => void;
  onTags: (tags: string[]) => void;
  onAppendDescription: (markdown: string) => void;
}

type Preview =
  | { kind: "mcqs"; questions: McqResult["questions"] }
  | { kind: "flashcards"; cards: FlashcardResult["cards"] }
  | { kind: "markdown"; text: string }
  | null;

function mcqsToMarkdown(questions: McqResult["questions"]): string {
  const letter = (i: number) => String.fromCharCode(65 + i);
  const blocks = questions.map((q, i) => {
    const opts = q.options.map((o, oi) => `   - ${letter(oi)}. ${o}`).join("\n");
    const ans = letter(q.answerIndex);
    return `${i + 1}. ${q.question}\n${opts}\n\n   **Answer:** ${ans}${q.explanation ? ` — ${q.explanation}` : ""}`;
  });
  return `## Practice Questions\n\n${blocks.join("\n\n")}\n`;
}

function flashcardsToMarkdown(cards: FlashcardResult["cards"]): string {
  const rows = cards.map((c) => `- **${c.front}** — ${c.back}`).join("\n");
  return `## Flashcards\n\n${rows}\n`;
}

export function ResourceAiTools({
  getSource,
  attachedFile,
  onExcerpt,
  onSeo,
  onTags,
  onAppendDescription,
}: Props) {
  const [busy, setBusy] = useState<Tool | null>(null);
  const [preview, setPreview] = useState<Preview>(null);
  const [count, setCount] = useState(5);
  const [useFile, setUseFile] = useState(false);

  const fileId = attachedFile?.id;
  const usingFile = useFile && !!fileId;

  async function call<T>(tool: Tool, extra?: { count?: number }): Promise<ToolResult<T> | null> {
    const src = getSource();
    if (src.title.trim().length < 3) {
      toast.error("Add a title first");
      return null;
    }
    if (!usingFile && src.text.trim().length < 20) {
      toast.error('Add a longer description, or attach a file and tick "Use attached file"');
      return null;
    }
    setBusy(tool);
    try {
      const payload = usingFile
        ? { tool, title: src.title, type: src.type, fileId, useFile: true, ...extra }
        : { tool, title: src.title, type: src.type, text: src.text, ...extra };
      const res = await fetch("/api/admin/resources/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({ error: "Unexpected response" }))) as ToolResult<T>;
      if (!res.ok) {
        toast.error("error" in data ? data.error : "AI request failed");
        return null;
      }
      return data;
    } catch {
      toast.error("Network error — please try again");
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function doExcerpt() {
    const r = await call<ExcerptResult>("excerpt");
    if (!r) return;
    if ("object" in r) {
      onExcerpt(r.object.excerpt.trim());
      setPreview(null);
      toast.success("Excerpt generated");
    } else if ("fallbackMarkdown" in r) {
      onExcerpt(r.fallbackMarkdown.trim().slice(0, 300));
      toast.success("Excerpt generated");
    }
  }

  async function doSeo() {
    const r = await call<SeoResult>("seo");
    if (!r) return;
    if ("object" in r) {
      onSeo({ metaTitle: r.object.metaTitle.trim(), metaDescription: r.object.metaDescription.trim() });
      setPreview(null);
      toast.success("SEO metadata generated");
    } else if ("fallbackMarkdown" in r) {
      setPreview({ kind: "markdown", text: r.fallbackMarkdown });
      toast.message("AI returned unstructured text — copy what you need below");
    }
  }

  async function doTags() {
    const r = await call<TagsResult>("tags");
    if (!r) return;
    if ("object" in r && r.object.tags.length) {
      onTags(r.object.tags);
      setPreview(null);
      toast.success(`Added ${r.object.tags.length} tag(s)`);
    } else if ("fallbackMarkdown" in r) {
      setPreview({ kind: "markdown", text: r.fallbackMarkdown });
    } else {
      toast.message("No tags suggested");
    }
  }

  async function doMcqs() {
    const r = await call<McqResult>("mcqs", { count });
    if (!r) return;
    if ("object" in r && r.object.questions.length) {
      setPreview({ kind: "mcqs", questions: r.object.questions });
    } else if ("fallbackMarkdown" in r) {
      setPreview({ kind: "markdown", text: r.fallbackMarkdown });
    } else {
      toast.message("No questions generated");
    }
  }

  async function doFlashcards() {
    const r = await call<FlashcardResult>("flashcards", { count });
    if (!r) return;
    if ("object" in r && r.object.cards.length) {
      setPreview({ kind: "flashcards", cards: r.object.cards });
    } else if ("fallbackMarkdown" in r) {
      setPreview({ kind: "markdown", text: r.fallbackMarkdown });
    } else {
      toast.message("No flashcards generated");
    }
  }

  function insertPreview() {
    if (!preview) return;
    const md =
      preview.kind === "mcqs"
        ? mcqsToMarkdown(preview.questions)
        : preview.kind === "flashcards"
          ? flashcardsToMarkdown(preview.cards)
          : preview.text;
    onAppendDescription(md);
    setPreview(null);
    toast.success("Inserted into description");
  }

  const Spin = ({ tool }: { tool: Tool }) =>
    busy === tool ? <Loader2 className="h-4 w-4 animate-spin" /> : null;

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">AI assist</p>
          <span className="text-xs text-muted-foreground">
            — generates from the {usingFile ? "attached file" : "title + description"}; review before publishing
          </span>
        </div>

        {fileId && (
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={useFile} onChange={(e) => setUseFile(e.target.checked)} className="h-3.5 w-3.5" />
            Use attached file ({attachedFile?.name || "PDF/DOCX/TXT"}) as the source
          </label>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" disabled={!!busy} onClick={doExcerpt}>
            <Spin tool="excerpt" /> <FileText className="h-4 w-4" /> Excerpt
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={!!busy} onClick={doSeo}>
            <Spin tool="seo" /> <Search className="h-4 w-4" /> SEO
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={!!busy} onClick={doTags}>
            <Spin tool="tags" /> <Tags className="h-4 w-4" /> Tags
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={!!busy} onClick={doMcqs}>
            <Spin tool="mcqs" /> <ListChecks className="h-4 w-4" /> MCQs
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={!!busy} onClick={doFlashcards}>
            <Spin tool="flashcards" /> <Layers className="h-4 w-4" /> Flashcards
          </Button>
          <label className="flex items-center gap-1 text-xs text-muted-foreground">
            count
            <input
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
              className="h-8 w-14 rounded-md border bg-background px-2 text-sm"
            />
          </label>
        </div>

        {preview && (
          <div className="space-y-3 rounded-md border bg-muted/30 p-3">
            {preview.kind === "mcqs" && (
              <ol className="list-decimal space-y-2 pl-5 text-sm">
                {preview.questions.map((q, i) => (
                  <li key={i}>
                    <p className="font-medium">{q.question}</p>
                    <ul className="mt-1 space-y-0.5">
                      {q.options.map((o, oi) => (
                        <li key={oi} className={oi === q.answerIndex ? "font-semibold text-primary" : ""}>
                          {String.fromCharCode(65 + oi)}. {o}
                          {oi === q.answerIndex ? " ✓" : ""}
                        </li>
                      ))}
                    </ul>
                    {q.explanation && <p className="mt-1 text-xs text-muted-foreground">{q.explanation}</p>}
                  </li>
                ))}
              </ol>
            )}
            {preview.kind === "flashcards" && (
              <ul className="space-y-1.5 text-sm">
                {preview.cards.map((c, i) => (
                  <li key={i}>
                    <span className="font-semibold">{c.front}</span> — {c.back}
                  </li>
                ))}
              </ul>
            )}
            {preview.kind === "markdown" && (
              <pre className="max-h-64 overflow-auto whitespace-pre-wrap text-xs">{preview.text}</pre>
            )}
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={insertPreview}>
                Insert into description
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setPreview(null)}>
                Dismiss
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
