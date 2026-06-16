"use client";

import { useRef, useState } from "react";
import { FileUp, Loader2, X, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/marketplace/config";

export interface ResourceFileValue {
  id?: string;
  fileName?: string;
  fileType?: string;
  sizeBytes?: number;
}

/** Uploads the PROTECTED resource file via the admin server route. */
export function ResourceFileUploadField({
  value,
  onChange,
}: {
  value: ResourceFileValue;
  onChange: (v: ResourceFileValue) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/resources/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { id?: string; fileName?: string; size?: number; fileType?: string; error?: string };
      if (!res.ok || !data.id) throw new Error(data.error || "Upload failed");
      onChange({ id: data.id, fileName: data.fileName, fileType: data.fileType, sizeBytes: data.size });
      toast.success("File uploaded (protected)");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (value.id) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
        <span className="flex min-w-0 items-center gap-2">
          <FileText className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate">{value.fileName}</span>
          {value.sizeBytes ? (
            <span className="shrink-0 text-xs text-muted-foreground">{formatBytes(value.sizeBytes)}</span>
          ) : null}
        </span>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => onChange({})}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={ref}
        type="file"
        accept="application/pdf,.pdf,.doc,.docx,.ppt,.pptx,.zip"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
      <Button type="button" variant="outline" onClick={() => ref.current?.click()} disabled={uploading}>
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
        Upload protected file
      </Button>
      <p className="mt-1 text-xs text-muted-foreground">
        Stored privately — only delivered via expiring, entitlement-checked links. Max 50MB.
      </p>
    </div>
  );
}
