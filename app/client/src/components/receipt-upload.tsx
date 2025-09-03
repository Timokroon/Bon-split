import * as React from "react";
import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { CloudUpload, Camera, FolderOpen, Calculator, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ocrImage, parseReceipt, type ParsedItem } from "@/lib/ocr";

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

  // OCR state
  const [ocrText, setOcrText] = useState<string>("");
  const [parsed, setParsed] = useState<ParsedItem[]>([]);
  const [isOcrRunning, setIsOcrRunning] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const isImage = useMemo(() => (file ? file.type.startsWith("image/") : false), [file]);

  // preview cleanup
  const revokePreview = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const setSelectedFile = useCallback(
    (f: File) => {
      setFile(f);
      revokePreview();
      if (f.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(f));
      }
      // reset OCR output bij nieuw bestand
      setOcrText("");
      setParsed([]);
    },
    [revokePreview]
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

  // (optioneel) server upload — gelaten voor later gebruik
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
      toast({ title: "Bon verwerkt (server)", description: data.message || "OCR voltooid." });
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

  // alleen klik op de container zelf opent de file-picker
  const onDropzoneClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isOcrRunning || uploadMutation.isPending) return;
    if (e.target !== e.currentTarget) return;
    onBrowseClick();
  };

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
    setOcrText("");
    setParsed([]);
  };

  /**
   * Zet geparste prijzen op bestaande orders in localStorage (label-match).
   * Returned hoeveel orders een (nieuwe) prijs hebben gekregen.
   */
  function applyParsedToOrders(items: ParsedItem[]) {
    if (!items.length) return { updated: 0 };

    let orders: any[] = [];
    try {
      orders = JSON.parse(localStorage.getItem("ordersV1") || "[]");
    } catch {}

    if (!Array.isArray(orders) || !orders.length) return { updated: 0 };

    // label -> price lookup
    const priceByLabel = new Map<string, number>();
    for (const it of items) {
      if (typeof it.price === "number") {
        priceByLabel.set(it.label.toLowerCase(), it.price);
      }
    }

    const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
    let updated = 0;

    for (const o of orders) {
      const lbl = norm(o.label || "");
      let price = priceByLabel.get(lbl);

      if (price === undefined) {
        priceByLabel.forEach((v, k) => {
          if (price === undefined && (lbl.startsWith(k) || k.startsWith(lbl))) {
            price = v;
          }
        });
      }

      if (typeof price === "number" && (!o.price || o.price === 0)) {
        o.price = price; // per stuk
        updated++;
      }
    }

    try {
      localStorage.setItem("ordersV1", JSON.stringify(orders));
    } catch {}
    window.dispatchEvent(new Event("ordersUpdated"));

    return { updated };
  }

  // OCR lokaal
  const onStartUpload = async () => {
    if (!file) {
      toast({ title: "Geen bestand gekozen", description: "Kies of sleep eerst een bon." });
      return;
    }

    try {
      setIsOcrRunning(true);
      setOcrText("");
      setParsed([]);

      const text = await ocrImage(file);
      setOcrText(text);

      // parse items + tip
      const parsedReceipt = parseReceipt(text);
      const items = parsedReceipt.items;
      setParsed(items);

      // prijzen toepassen
      const withPrices = items.filter((i) => typeof i.price === "number");
      const { updated } = applyParsedToOrders(withPrices);

      // fooi opslaan (zodat BillSplitting ‘m kan oppakken)
      if (typeof parsedReceipt.tip === "number") {
        localStorage.setItem("tipDetected", String(parsedReceipt.tip));
        window.dispatchEvent(new Event("tipUpdated"));
      }

      toast({
        title: "Bon gelezen",
        description: `OCR: ${items.length} itemregel(s), prijzen toegepast op ${updated} order(s)${
          parsedReceipt.tip ? `, fooi gedetecteerd: €${parsedReceipt.tip.toFixed(2)}` : ""
        }.`,
      });

      console.log("OCR tekst:\n", text);
      console.log("Geparste items:", items, "Tip:", parsedReceipt.tip);
    } catch (err: any) {
      toast({
        title: "Fout bij OCR",
        description: String(err?.message || err),
        variant: "destructive",
      });
    } finally {
      setIsOcrRunning(false);
    }
  };

  const goSplit = () => setLocation("/bill-splitting");

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
            : isOcrRunning || uploadMutation.isPending
            ? "border-slate-200 bg-slate-50"
            : "border-slate-300 hover:border-blue-400 hover:bg-blue-50/30",
        ].join(" ")}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onDropzoneClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf"
          onChange={onInputChange}
          disabled={isOcrRunning || uploadMutation.isPending}
        />

        {!file ? (
          <div className="space-y-3">
            <div className="mx-auto mb-1 h-12 w-12 rounded-full bg-slate-100 grid place-items-center">
              <Camera className="w-6 h-6 text-slate-500" />
            </div>
            {isOcrRunning ? (
              <>
                <p className="font-medium text-slate-700">Bon wordt gelezen…</p>
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
                onClick={(e) => {
                  e.stopPropagation();
                  onBrowseClick();
                }}
                disabled={isOcrRunning || uploadMutation.isPending}
                className="inline-flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Camera
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onBrowseClick();
                }}
                disabled={isOcrRunning || uploadMutation.isPending}
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
                  <span className="text-slate-400">({Math.ceil(file.size / 1024)} KB)</span>
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
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                disabled={isOcrRunning || uploadMutation.isPending}
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
                onClick={(e) => {
                  e.stopPropagation();
                  onStartUpload();
                }}
                disabled={isOcrRunning || !file}
                className="inline-flex items-center gap-2"
              >
                <CloudUpload className="w-4 h-4" />
                Verwerk bon
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onBrowseClick();
                }}
                disabled={isOcrRunning}
              >
                Ander bestand…
              </Button>
            </div>

            {/* OCR resultaten */}
            {(ocrText || parsed.length > 0) && (
              <div className="mt-5 space-y-3">
                {parsed.length > 0 && (
                  <div className="rounded-lg border border-slate-200 p-3">
                    <div className="font-semibold mb-2 text-slate-800">
                      Herkende items ({parsed.length})
                    </div>
                    <ul className="text-sm text-slate-700 list-disc ml-5">
                      {parsed.map((it, i) => (
                        <li key={i}>
                          {it.qty}× {it.label}
                          {typeof it.price === "number" && <> — €{it.price.toFixed(2)} p/st</>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {ocrText && (
                  <details className="rounded-lg border border-slate-200">
                    <summary className="cursor-pointer px-3 py-2 font-medium text-slate-800">
                      Ruwe OCR-tekst tonen
                    </summary>
                    <pre className="p-3 text-xs whitespace-pre-wrap text-slate-700">
                      {ocrText}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Primaire actie: naar scherm 2 */}
      <div className="mt-6">
        <Button
          type="button"
          onClick={goSplit}
          className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Calculator className="w-4 h-4" />
          Afronden &amp; Rekening Verdelen
        </Button>
        <p className="mt-2 text-xs text-slate-500 text-center">
          Je kunt ook eerst afronden en later de bon uploaden.
        </p>
      </div>
    </div>
  );
}
