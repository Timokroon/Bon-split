import Tesseract from "tesseract.js";

export type ParsedItem = {
  label: string;
  qty: number;
  price?: number; // per stuk
};

export type ParsedReceipt = {
  items: ParsedItem[];
  tip?: number;
  subtotal?: number;
  total?: number;
};

// ==== preprocessing helpers ====
function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = r.result as string;
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

async function preprocessForOCR(file: File): Promise<string> {
  const img = await fileToImage(file);
  const scale = Math.min(2000 / img.width, 2);
  const w = Math.round(img.width * (scale > 1 ? scale : 1));
  const h = Math.round(img.height * (scale > 1 ? scale : 1));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return (await fileToImage(file)).src;

  ctx.drawImage(img, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  const contrast = 1.2;
  const threshold = 180;

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    let c = (gray - 128) * contrast + 128;
    const bw = c > threshold ? 255 : 0;
    data[i] = data[i + 1] = data[i + 2] = bw;
  }
  ctx.putImageData(imageData, 0, 0);

  return canvas.toDataURL("image/png");
}

export async function ocrImage(file: File): Promise<string> {
  const processed = await preprocessForOCR(file);

  const cfg: any = {
    tessedit_char_whitelist:
      "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ€$.,-xX ",
    tessedit_pageseg_mode: "6",
    preserve_interword_spaces: "1",
    user_defined_dpi: "300",
    logger: () => {},
  };

  const { data } = await (Tesseract as any).recognize(processed, "eng+nld", cfg);
  return (data.text || "").trim();
}

// ===== parser helpers =====
const toNum = (s: string) => {
  // normaliseer: 9,- -> 9,00   11, -> 11
  let t = s.replace(/-,?$/, ",00");
  if (/[.,]$/.test(t)) t = t.slice(0, -1);
  // verwijder valutasymbool en spaties
  t = t.replace(/[€$]/g, "").trim();
  return Number(t.replace(",", "."));
};

/**
 * parseReceipt:
 * - herkent itemregels zoals:
 *   "3 bier ........ $10,50"
 *   "2 Coke ......... $6"
 *   "1 pizza ........ €11,45"
 * - berekent prijs per stuk (totaal/qty) als er geen p/st staat
 * - herkent "Tip $2,50", "Subtotal ...", "Total ..."
 */
export function parseReceipt(text: string): ParsedReceipt {
  const items: ParsedItem[] = [];
  let tip: number | undefined;
  let subtotal: number | undefined;
  let total: number | undefined;

  const lines = text
    .split(/\r?\n/g)
    .map((l) =>
      l
        .replace(/[€]|EUR/gi, "€")
        .replace(/\s{2,}/g, " ")
        .trim()
    )
    .filter(Boolean);

  for (const rawLine of lines) {
    const line = rawLine.replace(/[.;:]+$/g, "");

    // Tip / Subtotal / Total
    let m =
      line.match(/^\s*tip\s+€?\$?\s*([0-9]+(?:[.,][0-9]{1,2})?)\s*$/i) ||
      line.match(/^\s*tip\s*[:=]?\s*€?\$?\s*([0-9]+(?:[.,][0-9]{1,2})?)\s*$/i);
    if (m) {
      tip = toNum(m[1]);
      continue;
    }
    m = line.match(/^\s*subtotal.*?€?\$?\s*([0-9]+(?:[.,][0-9]{1,2})?)\s*$/i);
    if (m) {
      subtotal = toNum(m[1]);
      continue;
    }
    m = line.match(/^\s*total.*?€?\$?\s*([0-9]+(?:[.,][0-9]{1,2})?)\s*$/i);
    if (m) {
      total = toNum(m[1]);
      continue;
    }

    // Itemregel patronen
    // 1) "<qty> <label> .... €/$<total>"
    m = line.match(
      /^(\d+)\s+([A-Za-zÀ-ÿ0-9 .,'-]+?)\s+€?\$?\s*([0-9]+(?:[.,][0-9]{1,2})?)$/i
    );
    if (m) {
      const qty = Number(m[1]);
      const label = m[2].trim();
      const totalPrice = toNum(m[3]);
      const unit = qty > 0 ? totalPrice / qty : totalPrice;
      items.push({ label, qty: Math.max(1, qty), price: Number(unit.toFixed(2)) });
      continue;
    }

    // 2) "<label> <qty>x .... €/$<total>"  (komt minder vaak voor)
    m = line.match(
      /^([A-Za-zÀ-ÿ0-9 .,'-]+?)\s+(\d+)\s*x\s+€?\$?\s*([0-9]+(?:[.,][0-9]{1,2})?)$/i
    );
    if (m) {
      const label = m[1].trim();
      const qty = Number(m[2]);
      const totalPrice = toNum(m[3]);
      const unit = qty > 0 ? totalPrice / qty : totalPrice;
      items.push({ label, qty: Math.max(1, qty), price: Number(unit.toFixed(2)) });
      continue;
    }
  }

  return { items, tip, subtotal, total };
}

// ============ vorige eenvoudige items-parser nog exporteren
// (blijft bruikbaar voor de UI-lijst)
export function parseReceiptText(text: string): ParsedItem[] {
  return parseReceipt(text).items;
}
