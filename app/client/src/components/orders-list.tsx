import * as React from "react";
import { Minus, Plus } from "lucide-react";
import type { Person } from "./people-manager";

export type OrderItem = {
  id: string;
  label: string;
  qty: number;
  personName?: string;
  price?: number;
};

type OrdersListProps = {
  orders: OrderItem[];
  totalItems: number;
  isLoading?: boolean;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onRemove: (id: string) => void;
  people: Person[];
};

export default function OrdersList({
  orders,
  totalItems,
  isLoading = false,
  onIncrement,
  onDecrement,
  onRemove,
  people,
}: OrdersListProps) {
  if (isLoading) return <p className="text-sm text-slate-500">Laden…</p>;
  if (orders.length === 0) return <p className="text-sm text-slate-500">Nog geen bestellingen. Voeg iets toe hierboven.</p>;

  return (
    <div className="divide-y divide-slate-200">
      {orders.map((o) => (
        <div key={o.id} className="py-3 flex items-center justify-between">
          <div className="min-w-0">
            <div className="font-medium text-slate-800">{o.label}</div>
            <div className="text-xs text-slate-500">
              {o.personName
                ? `Voor: ${o.personName}`
                : people.length
                ? "Nog niet toegewezen"
                : "Geen personen aangemaakt"}
              {typeof o.price === "number" ? ` • €${o.price.toFixed(2)}` : ""}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="rounded-md border px-2 py-1 text-sm"
              onClick={() => onDecrement(o.id)}
              aria-label="Minder"
              title="Minder"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center tabular-nums">{o.qty}</span>
            <button
              className="rounded-md border px-2 py-1 text-sm"
              onClick={() => onIncrement(o.id)}
              aria-label="Meer"
              title="Meer"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              className="ml-3 rounded-md border px-2 py-1 text-sm text-red-600"
              onClick={() => onRemove(o.id)}
              aria-label="Verwijderen"
              title="Verwijderen"
            >
              🗑
            </button>
          </div>
        </div>
      ))}

      <div className="pt-3 text-right text-xs text-slate-500">Totaal items: {totalItems}</div>
    </div>
  );
}
