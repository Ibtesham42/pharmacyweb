"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Upload, Trash2, FileText, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { uploadToCloudinary } from "@/lib/upload-client";

interface MediaItem {
  id: string;
  type: string;
  url: string;
  fileName: string;
}

export function MediaLibrary({ items }: { items: MediaItem[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) await uploadToCloudinary(file);
      toast.success("Uploaded");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this file?")) return;
    const res = await fetch(`/api/media/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Deleted");
      router.refresh();
    } else toast.error("Could not delete");
  }

  return (
    <div className="space-y-4">
      <div>
        <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload files
        </Button>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          hidden
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No media yet. Upload images or PDFs to use in posts.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((m) => (
            <Card key={m.id} className="group relative overflow-hidden">
              <div className="relative flex aspect-square items-center justify-center bg-muted">
                {m.type === "IMAGE" ? (
                  <Image src={m.url} alt={m.fileName} fill sizes="200px" className="object-cover" />
                ) : (
                  <FileText className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              <div className="flex items-center justify-between gap-1 p-2">
                <span className="line-clamp-1 text-xs">{m.fileName}</span>
                <div className="flex shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      navigator.clipboard.writeText(m.url);
                      toast.success("URL copied");
                    }}
                    aria-label="Copy URL"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(m.id)} aria-label="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
