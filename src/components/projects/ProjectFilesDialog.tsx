"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  FileText,
  Download,
  Eye,
  Trash2,
  Loader2,
  Pencil,
  Check,
  X,
  ArrowLeft,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FileUploadZone, PendingFile } from "@/components/ui/file-upload-zone";
import { apiUpload } from "@/lib/api-client";
import IndexCounter from "../dashboard/IndexCounter";

interface ProjectFile {
  id: number;
  title: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

interface ProjectFilesDialogProps {
  projectId: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProjectFilesDialog({ projectId }: ProjectFilesDialogProps) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ProjectFile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [previewFile, setPreviewFile] = useState<ProjectFile | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/files`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFiles(data);
    } catch {
      toast.error("Failed to load files");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Lazy load: fetch only when dialog opens; clear preview on close
  useEffect(() => {
    if (open) {
      fetchFiles();
    } else {
      setPreviewFile(null);
    }
  }, [open, fetchFiles]);

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingId !== null) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [editingId]);

  const startEdit = (file: ProjectFile) => {
    setEditingId(file.id);
    setEditTitle(file.title);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const saveTitle = async () => {
    if (editingId === null || !editTitle.trim()) return;

    try {
      const res = await fetch(
        `/api/projects/${projectId}/files/${editingId}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: editTitle.trim() }),
        }
      );
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setFiles((prev) =>
        prev.map((f) => (f.id === updated.id ? updated : f))
      );
      toast.success("Title updated");
    } catch {
      toast.error("Failed to update title");
    } finally {
      setEditingId(null);
      setEditTitle("");
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveTitle();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/files/${deleteTarget.id}`,
        { method: "DELETE", credentials: "include" }
      );
      if (!res.ok) throw new Error();
      setFiles((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      toast.success("File deleted");
    } catch {
      toast.error("Failed to delete file");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleUpload = async () => {
    const valid = pendingFiles.filter((f) => !f.error);
    if (!valid.length) return;

    setUploading(true);
    try {
      const formData = new FormData();
      const titles: string[] = [];
      for (const entry of valid) {
        formData.append("files", entry.file);
        titles.push(entry.title || entry.file.name.replace(/\.pdf$/i, ""));
      }
      formData.append("titles", JSON.stringify(titles));

      const created = await apiUpload<ProjectFile[]>(
        `/api/projects/${projectId}/files`,
        formData
      );
      setFiles((prev) => [...created, ...prev]);
      setPendingFiles([]);
      toast.success(`${created.length} file(s) uploaded`);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const validPending = pendingFiles.filter((f) => !f.error);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 font-bold">
            <FileText className="w-4 h-4" /> View Files
          </Button>
        </DialogTrigger>
        <DialogContent className={cn(
          "max-h-[90vh] overflow-y-auto",
          previewFile ? "max-w-5xl" : "max-w-2xl"
        )}>
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              {previewFile ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 -ml-1"
                    onClick={() => setPreviewFile(null)}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <FileText className="w-5 h-5 text-primary" />
                  {previewFile.title}
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5 text-primary" /> Project Documents
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {previewFile ? (
            /* PDF Preview */
            <div className="mt-2 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground truncate">
                  {previewFile.fileName} ({formatSize(previewFile.fileSize)})
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2 font-bold shrink-0"
                  asChild
                >
                  <a
                    href={`/api/projects/${projectId}/files/${previewFile.id}/download?download=true`}
                    download
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                </Button>
              </div>
              <iframe
                src={`/api/projects/${projectId}/files/${previewFile.id}/download`}
                className="w-full rounded-lg border bg-muted"
                style={{ height: "70vh" }}
                title={previewFile.title}
              />
            </div>
          ) : (
            /* File list + upload */
            <div className="space-y-6 mt-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : files.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">
                  No documents uploaded yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {files.map((file,index) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-secondary/10 group"
                    >
                      <FileText className="w-5 h-5 shrink-0 text-primary" />
                      <div className="flex-1 min-w-0">
                        {editingId === file.id ? (
                          <div className="flex items-center gap-1">
                         
                            <Input
                              ref={editInputRef}
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={handleEditKeyDown}
                              onBlur={saveTitle}
                              className="h-7 text-sm font-bold"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={saveTitle}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={cancelEdit}
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                            
                          </div>
                        ) : (
                          <div
                            className="text-sm font-bold truncate cursor-pointer hover:text-primary transition-colors"
                            onClick={() => startEdit(file)}
                            title="Click to edit title"
                          >
                            {file.title}
                            <Pencil className="w-3 h-3 inline ml-1 opacity-0 group-hover:opacity-50" />
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                          
                          <span className="truncate">{file.fileName} </span>
                          <span>({formatSize(file.fileSize)})</span>
                          <span>
                            {new Date(file.uploadedAt).toLocaleDateString()}
                          </span>
                          
                        </div>
                        
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                         <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="relative h-8 w-8 text-destructive"
                          title="Delete"
                          onClick={() => setDeleteTarget(file)}
                        >
                         <IndexCounter index={index} />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Preview"
                          onClick={() => setPreviewFile(file)}
                        >
                          <Eye className="w-4 h-4" />
                          
                        </Button>
                        
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Download"
                          asChild
                        >
                          <a
                            href={`/api/projects/${projectId}/files/${file.id}/download?download=true`}
                            download
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </Button>
                       
                         
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          title="Delete"
                          onClick={() => setDeleteTarget(file)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload section */}
              <div className="border-t pt-4 space-y-3">
                <p className="text-[10px] font-black uppercase text-muted-foreground">
                  Upload Documents
                </p>
                <FileUploadZone files={pendingFiles} onChange={setPendingFiles} />
                {validPending.length > 0 && (
                  <Button
                    type="button"
                    className="w-full font-bold"
                    onClick={handleUpload}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Uploading...
                      </>
                    ) : (
                      `Upload ${validPending.length} File${validPending.length > 1 ? "s" : ""}`
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.title}&quot;?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
