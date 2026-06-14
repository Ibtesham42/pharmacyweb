"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadToCloudinary, registerExternalImage, ACCEPT_IMAGE } from "@/lib/upload-client";

export interface FeaturedImageValue {
  id?: string;
  url?: string;
}

/** Featured image picker: drag/drop or click upload, with URL paste fallback. */
export function ImageUploadField({
  value,
  onChange,
}: {
  value: FeaturedImageValue;
  onChange: (v: FeaturedImageValue) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const media = await uploadToCloudinary(file);
      onChange({ id: media.id, url: media.url });
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (value.url) {
    return (
      <div className="relative w-full overflow-hidden rounded-lg border">
        <div className="relative aspect-[16/9] bg-muted">
          <Image src={value.url} alt="Featured" fill className="object-cover" sizes="400px" />
        </div>
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute right-2 top-2 h-8 w-8"
          onClick={() => onChange({})}
          aria-label="Remove image"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        onClick={() => fileRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          dragging ? "border-primary bg-accent" : "hover:border-primary/50"
        }`}
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        ) : (
          <Upload className="h-8 w-8 text-muted-foreground" />
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          Drag &amp; drop or click to upload (max 5MB)
        </p>
      </div>
      <input ref={fileRef} type="file" accept={ACCEPT_IMAGE} hidden onChange={(e) => {
        const f = e.target.files?.[0];
        if (f) handleFile(f);
      }} />
      <Input
        placeholder="…or paste an image URL"
        defaultValue=""
        onBlur={async (e) => {
          const url = e.target.value.trim();
          if (!url) return;
          setUploading(true);
          try {
            const media = await registerExternalImage(url);
            onChange({ id: media.id, url: media.url });
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Could not save image");
          } finally {
            setUploading(false);
          }
        }}
      />
    </div>
  );
}
