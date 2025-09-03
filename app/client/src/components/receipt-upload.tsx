import * as React from "react";
import { useState, useRef, useMemo, useCallback } from "react";
import { CloudUpload, Camera, FolderOpen, Calculator, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";

type ReceiptUploadResponse = {
  success: boolean;
  receipt: any;
  splitResults: any[];
  message: string;
};

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];

export default function ReceiptUpload() {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const isImage = useMemo(() => (file ? file.type.startsWith("image/") : false), [file]);

  const revokePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const setSelectedFile = useCallback(
    (f: File) => {
      setFile(f);
      revokePreview();
      if (f.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(f));
      }
    },
    [previewUrl]
  );

  const validateAndSet = (f: File | undefined | null) => {
    if (!f) return;
    if (!ALLOWED.includes(f.type)) {
      toast({
        title: "Ongeldig bestand",
        description: "Alleen PNG, JPG en PDF zijn toegestaan.",
        variant: "destructive",
      });
      return;
    }
    if (f.size > MAX_SIZE) {
      toast({
        title: "Bestand te groot",
        description: "Maximaal 10MB.",
        variant: "destructive",
      });
      return;
    }
    setSelectedFile(f);
  };

  const uploadMutation = useMutation({
    mutationFn: async (f: File): Promise<ReceiptUploadResponse> => {
      const formData = new FormData();
      formData.append("receipt", f);
      const res = await fetch("/api/receipt", { method: "POST", body: formData });
      if (!res.ok) {
        let msg = "Upload mislukt";
        try {
          const err = await res.json();
          msg = err?.message || msg;
        } catch {}
        throw new Error(msg);
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Bon verwerkt", description: data.message || "OCR voltooid." });
      // Broadcast voor andere schermen indien gewenst
      window.dispatchEvent(new CustomEvent("receiptProcessed", { detail: data }));
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij verwerken bon",
        description: error?.message ?? "Onbekende fout.",
        variant: "destructive",
      });
    },
  });

  // Handlers
  const onBrowseClick = () => fileInputRef.current?.click();

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    validateAndSet(f);
    e.currentTarget.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    validateAndSet(e.dataTransfer.files?.[0]);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = () => setDragOver(false);

  const onClear = () => {
    setFile(null);
    revokePreview();
  };

  const onStartUpload = () => {
    if (!file) {
      toast({
        title: "Geen bestand gekozen",
        description: "Kies of sleep eerst een bon.",
      });
      return;
    }
    uploadMutation.mutate(file);
  };

  const goSplit = () => {
    // Navigatie naar scherm 2 — los van uploadstatus
    setLocation("/bill-splitting");
  };

  return (
    <div className="rounded-xl shadow-sm border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2 mb-4">
        <CloudUpload className="w-5 h-5 text-amber-500" />
        <h2 className="text-lg font-semibold text-slate-800">Bon Uploaden</h2>
      </div>

      {/* Dropzone */}
      <div
        className={[
          "rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition",
          dragOver
            ? "border-blue-400 bg-blue-50/50"
            : uploadMutation.isPending
            ? "border-slate-200 bg-slate-50"
            : "border-slate-300 hover:border-blue-400 hover:bg-blue-50/30",
        ].join(" ")}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={!uploadMutation.isPending ? onBrowseClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf"
          onChange={onInputChange}
          disabled={uploadMutation.isPending}
        />

        {!file ? (
          <div className="space-y-3">
            <div className="mx-auto mb-1 h-12 w-12 rounded-full bg-slate-100 grid place-items-center">
              <Camera className="w-6 h-6 text-slate-500" />
            </div>
            {uploadMutation.isPending ? (
              <>
                <p className="font-medium text-slate-700">Bon wordt verwerkt…</p>
                <p className="text-sm text-slate-500">Even geduld terwijl we de tekst analyseren</p>
              </>
            ) : (
              <>
                <p className="font-medium text-slate-700">Sleep je bon hierheen</p>
                <p className="text-sm text-slate-500">of klik om een foto te selecteren</p>
              </>
            )}
            <p className="text-xs text-slate-400">PNG, JPG, PDF tot 10MB</p>

            <div className="mt-3 flex items-center justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onBrowseClick}
                disabled={uploadMutation.isPending}
                className="inline-flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Camera
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onBrowseClick}
                disabled={uploadMutation.isPending}
                className="inline-flex items-center gap-2"
              >
                <FolderOpen className="w-4 h-4" />
                Galerij
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-left">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="text-sm text-slate-700">
                  <span className="font-medium">Bestand:</span> {file.name}{" "}
                  <span className="text-slate-400">
                    ({Math.ceil(file.size / 1024)} KB)
                  </span>
                </div>

                {isImage && previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Bon preview"
                    className="mt-3 max-h-64 rounded-md border border-slate-200"
                  />
                ) : (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm">
                    PDF geselecteerd — voorbeeld niet beschikbaar
                  </div>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={onClear}
                disabled={uploadMutation.isPending}
                className="shrink-0 inline-flex items-center gap-2"
                title="Bestand verwijderen"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                Verwijder
              </Button>
            </div>

            <div className="mt-4 flex gap-3">
              <Button
                type="button"
                onClick={onStartUpload}
                disabled={uploadMutation.isPending || !file}
                className="inline-flex items-center gap-2"
              >
                <CloudUpload className="w-4 h-4" />
                Verwerk bon
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onBrowseClick}
                disabled={uploadMutation.isPending}
              >
                Ander bestand…
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Primary action: altijd naar scherm 2 */}
      <Button
        type="button"
        onClick={goSplit}
        className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5"
      >
        <Calculator className="w-4 h-4 mr-2" />
        Afronden & Rekening Verdelen
      </Button>

      <p className="mt-2 text-xs text-slate-500 text-center">
        Je kunt ook eerst afronden en later de bon uploaden.
      </p>
    </div>
  );
}
