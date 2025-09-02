// app/client/src/lib/order-bus.ts
// Simpele event-bus voor "order toegevoegd"

export type AddOrderPayload = {
  label: string;
  qty?: number;
  personName?: string;
  price?: number;
};

export type Unsub = () => void;

const listeners: Set<(p: AddOrderPayload) => void> = new Set();

export function onAddOrder(fn: (p: AddOrderPayload) => void): Unsub {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function emitAddOrder(p: AddOrderPayload): void {
  // gebruik forEach (werkt ook bij lagere TS targets)
  listeners.forEach((fn) => fn(p));
}
