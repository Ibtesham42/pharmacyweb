"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Markdown } from "@/components/markdown";
import { uploadToCloudinary, ACCEPT_IMAGE } from "@/lib/upload-client";

/** Markdown editor with Write/Preview tabs and inline image upload. */
export function MarkdownEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  function insertAtCursor(text: string) {
    const el = ref.current;
    if (!el) {
      onChange(value + text);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    onChange(value.slice(0, start) + text + value.slice(end));
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const media = await uploadToCloudinary(file);
      insertAtCursor(`\n![${media.fileName}](${media.url})\n`);
      toast.success("Image inserted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <Tabs defaultValue="write">
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="write">Write</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          Insert image
        </Button>
        <input ref={fileRef} type="file" accept={ACCEPT_IMAGE} hidden onChange={onFile} />
      </div>

      <TabsContent value="write">
        <Textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={18}
          placeholder="Write content in Markdown… **bold**, # headings, - lists, [links](url)"
          className="font-mono text-sm"
        />
        <p className="mt-1 text-xs text-muted-foreground">Markdown supported: headings, bold, lists, links, tables, images.</p>
      </TabsContent>
      <TabsContent value="preview">
        <div className="min-h-[300px] rounded-md border p-4">
          {value ? <Markdown content={value} /> : <p className="text-sm text-muted-foreground">Nothing to preview.</p>}
        </div>
      </TabsContent>
    </Tabs>
  );
}
