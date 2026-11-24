"use client";

import * as React from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2, Star, X } from "lucide-react";

interface ImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  multiple?: boolean;
}

export function ImageUploader({ value, onChange, multiple = true }: ImageUploaderProps) {
  const [uploading, setUploading] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const targetFiles = multiple ? Array.from(files) : [files[0]];
      const uploaded: string[] = [];
      for (const file of targetFiles) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error);
        uploaded.push(json.data.url);
      }
      onChange(multiple ? [...value, ...uploaded] : [uploaded[0]]);
      toast.success(`已上传 ${uploaded.length} 张`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "上传失败");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function moveToFirst(idx: number) {
    if (idx <= 0 || idx >= value.length) return;
    const next = [...value];
    const [picked] = next.splice(idx, 1);
    next.unshift(picked);
    onChange(next);
  }

  const canUploadMore = multiple || value.length === 0;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={`rounded-lg border p-3 transition-colors ${
        dragging ? "border-primary bg-primary/5" : "border-border bg-muted/20"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="flex flex-wrap gap-3">
        {value.map((url, idx) => (
          <div
            key={`${url}-${idx}`}
            className="group relative h-22 w-22 shrink-0 overflow-hidden rounded-lg border bg-background shadow-xs"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />

            {multiple && idx === 0 && (
              <span className="absolute bottom-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                主图
              </span>
            )}

            <div className="absolute inset-x-0 top-0 flex justify-between p-1 opacity-0 transition-opacity group-hover:opacity-100">
              {multiple && idx > 0 ? (
                <button
                  type="button"
                  title="设为主图"
                  onClick={() => moveToFirst(idx)}
                  className="rounded bg-black/65 p-1 text-white hover:bg-black/85"
                >
                  <Star className="h-3 w-3" />
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                title="移除"
                onClick={() => onChange(value.filter((_, i) => i !== idx))}
                className="rounded bg-black/65 p-1 text-white hover:bg-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}

        {canUploadMore && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="flex h-22 w-22 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-muted-foreground/35 bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ImagePlus className="h-5 w-5" />
            )}
            <span className="text-[11px]">{uploading ? "上传中" : "上传图片"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
