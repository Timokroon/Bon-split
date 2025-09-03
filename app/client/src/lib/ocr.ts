// app/client/src/lib/ocr.ts
import Tesseract from "tesseract.js";

export type ParsedItem = {
  label: string;
  qty: number;
  price?: number; // per stuk (indien gevonden)
};

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/**
 * Simpele OCR helper met Tesseract.recognize (v5-compatibel).
 * Geen createWorker, geen workerPath/corePath hassle.
 */
export async function ocrImage(file: File): Promise<string> {
  const image = await fileToDataURL(file);
  const { data } = await Tesseract.recognize(image, "eng+nld", {
    logger: () => {}, // desgewenst: (m) => console.log(m)
  });
  return (data.text || "").trim();
}

/**
 * Eenvoudige parser voor veelvoorkomende bonregels:
 * - "3x bier 2,75"
 * - "bier 3x 2,75"
 * - "bier 3x €2,75"
 * - "bier €2,75 3x"
 * - "2x cola"
 * - "cola 2x"
 */
export function parseReceiptText(text: string): ParsedItem[] {
  const items: ParsedItem[] = [];

  const lines = text
    .split(/\r?\n/g)
    .map((l) => l.replace(/[€]|EUR/gi, "€").trim())
    .filter(Boolean);

  const toNum = (s: string) => Number(s.replace(",", "."));

  for (const line of lines) {
    // Met prijs + qty
    let m =
      line.match(/^(\d+)\s*x?\s+([A-Za-zÀ-ÿ0-9 .,'-]+?)\s+€?\s*([0-9]+[.,][0-9]{2})$/i) ||
      line.match(/^([A-Za-zÀ-ÿ0-9 .,'-]+?)\s+(\d+)\s*x\s+€?\s*([0-9]+[.,][0-9]{2})$/i) ||
      line.match(/^([A-Za-zÀ-ÿ0-9 .,'-]+?)\s+€?\s*([0-9]+[.,][0-9]{2})\s+(\d+)\s*x$/i);

    if (m) {
      let qty: number, label: string, priceStr: string;
      if (/^\d+/.test(m[1])) {
        qty = Number(m[1]);
        label = m[2].trim();
        priceStr = m[3];
      } else if (/^\d+/.test(m[2])) {
        label = m[1].trim();
        qty = Number(m[2]);
        priceStr = m[3];
      } else {
        label = m[1].trim();
        priceStr = m[2];
        qty = Number(m[3]);
      }
      items.push({ label, qty: Math.max(1, qty), price: toNum(priceStr) });
      continue;
    }

    // Zonder prijs
    m =
      line.match(/^(\d+)\s*x?\s+([A-Za-zÀ-ÿ0-9 .,'-]+)$/i) ||
      line.match(/^([A-Za-zÀ-ÿ0-9 .,'-]+)\s+(\d+)\s*x$/i);
    if (m) {
      let qty: number, label: string;
      if (/^\d+/.test(m[1])) {
        qty = Number(m[1]);
        label = m[2].trim();
      } else {
        label = m[1].trim();
        qty = Number(m[2]);
      }
      items.push({ label, qty: Math.max(1, qty) });
      continue;
    }
  }

  return items;
}
