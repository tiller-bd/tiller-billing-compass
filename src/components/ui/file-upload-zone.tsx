"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface PendingFile {
  id: string;
  file: File;
  title: string;
  error?: string;
}

interface FileUploadZoneProps {
  files: PendingFile[];
  onChange: (files: PendingFile[]) => void;
  maxFileSize?: number; // bytes, default 10MB
  maxTotalSize?: number; // bytes, default 50MB
}

const DEFAULT_MAX_FILE = 10 * 1024 * 1024;
const DEFAULT_MAX_TOTAL = 50 * 1024 * 1024;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

let fileIdCounter = 0;
function nextId() {
  return `pending-${++fileIdCounter}-${Date.now()}`;
}

export function FileUploadZone({
  files,
  onChange,
  maxFileSize = DEFAULT_MAX_FILE,
  maxTotalSize = DEFAULT_MAX_TOTAL,
}: FileUploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const totalSize = files.reduce((s, f) => s + f.file.size, 0);

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const arr = Array.from(incoming);
      const newEntries: PendingFile[] = [];

      for (const file of arr) {
        let error: string | undefined;
        if (file.type !== "application/pdf") {
          error = "Not a PDF file";
        } else if (file.size > maxFileSize) {
          error = `Exceeds ${formatSize(maxFileSize)} limit`;
        }
        newEntries.push({
          id: nextId(),
          file,
          title: file.name.replace(/\.pdf$/i, ""),
          error,
        });
      }

      const next = [...files, ...newEntries];

      // Check total size
      const newTotal = next.reduce((s, f) => s + f.file.size, 0);
      if (newTotal > maxTotalSize) {
        // Mark last added files that push over the limit
        let running = files.reduce((s, f) => s + f.file.size, 0);
        for (const entry of newEntries) {
          running += entry.file.size;
          if (running > maxTotalSize && !entry.error) {
            entry.error = "Total upload size exceeds limit";
          }
        }
      }

      onChange(next);
    },
    [files, onChange, maxFileSize, maxTotalSize]
  );

  const removeFile = useCallback(
    (id: string) => {
      onChange(files.filter((f) => f.id !== id));
    },
    [files, onChange]
  );

  const updateTitle = useCallback(
    (id: string, title: string) => {
      onChange(files.map((f) => (f.id === id ? { ...f, title } : f)));
    },
    [files, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const totalSizeColor =
    totalSize > maxTotalSize
      ? "text-red-500"
      : totalSize > maxTotalSize * 0.8
      ? "text-yellow-500"
      : "text-muted-foreground";

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/40"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm font-bold text-muted-foreground">
          Drag & drop PDF files here
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          or click to browse ({formatSize(maxFileSize)} per file,{" "}
          {formatSize(maxTotalSize)} total)
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) {
              addFiles(e.target.files);
              e.target.value = "";
            }
          }}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((entry) => (
            <div
              key={entry.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border bg-secondary/10",
                entry.error && "border-red-500/30 bg-red-500/5"
              )}
            >
              <FileText className="w-5 h-5 shrink-0 text-primary" />
              <div className="flex-1 min-w-0 space-y-1">
                <Input
                  value={entry.title}
                  onChange={(e) => updateTitle(entry.id, e.target.value)}
                  placeholder="File title"
                  className="h-7 text-sm font-bold"
                />
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="truncate">{entry.file.name}</span>
                  <span>({formatSize(entry.file.size)})</span>
                </div>
                {entry.error && (
                  <div className="flex items-center gap-1 text-[10px] text-red-500 font-bold">
                    <AlertCircle className="w-3 h-3" />
                    {entry.error}
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8 text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(entry.id);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}

          {/* Total size counter */}
          <div className={cn("text-xs font-bold text-right", totalSizeColor)}>
            Total: {formatSize(totalSize)} / {formatSize(maxTotalSize)}
          </div>
        </div>
      )}
    </div>
  );
}
