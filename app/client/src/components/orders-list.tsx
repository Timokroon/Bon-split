import * as React from "react";
import { Minus, Plus, Trash2, List } from "lucide-react";
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

const DRINKS = ["bier","cola","wijn","water","spa","fris","sprite","fanta","icetea","ice-tea"];

function sortItems(items: OrderItem[]) {
  return [...items].sort((a, b) => {
    const ad = DRINKS.some((k) => a.label.toLowerCase().includes(k));
    const bd = DRINKS.some((k) => b.label.toLowerCase().includes(k));
    if (ad && !bd) return -1;
    if (!ad && bd) return 1;
    return a.label.localeCompare(b.label);
  });
}

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

  // groepeer: toon iedereen (ook als ze nog geen items hebben)
  const groups = new Map<string, { person?: Person; items: OrderItem[] }>();
  for (const p of people) groups.set(p.name, { person: p, items: [] });

  let hasUnassigned = false;
  for (const o of orders) {
    const key = o.personName ?? "_unassigned";
    if (!groups.has(key)) groups.set(key, { person: undefined, items: [] });
    groups.get(key)!.items.push(o);
    if (!o.personName) hasUnassigned = true;
  }

  if (groups.size === 0) {
    return (
      <p className="text-sm text-slate-500">
        Nog geen bestellingen. Voeg iemand toe of typ <em>“timo bier”</em>.
      </p>
    );
  }

  return (
    <div className="divide-y divide-slate-200">
      {Array.from(groups.entries()).map(([key, group], idx) => {
        const items = sortItems(group.items);
        const unknown = key === "_unassigned";
        if (unknown && !hasUnassigned) return null;

        return (
          <div key={key} className={idx === 0 ? "pt-0 pb-3" : "py-3"}>
            {/* kop per persoon – geen extra randen */}
            <div className="flex items-center gap-3 mb-2">
              {unknown ? (
                <div className="w-8 h-8 rounded-full bg-slate-300 text-white grid place-items-center">
                  <List className="w-4 h-4" />
                </div>
              ) : (
                <div
                  className={`w-8 h-8 rounded-full ${
                    group.person?.color ?? "bg-slate-300"
                  } text-white grid place-items-center`}
                >
                  {group.person?.initial ?? key.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-medium">
                {unknown ? "Niet toegewezen" : group.person?.name ?? key}
              </span>
            </div>

            {/* items – geen border (om dubbele randen te voorkomen) */}
            {items.length === 0 ? (
              <div className="text-xs text-slate-500 ml-11">Nog geen items</div>
            ) : (
              <ul className="space-y-1 ml-11">
                {items.map((o) => (
                  <li key={o.id} className="flex items-center justify-between">
                    <span className="truncate">{o.qty}× {o.label}</span>
                    <span className="inline-flex items-center gap-2">
                      <button
                        className="h-7 w-7 grid place-items-center rounded border border-slate-300 disabled:opacity-50"
                        onClick={() => onDecrement(o.id)}
                        disabled={o.qty <= 1}
                        aria-label="Minder"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <button
                        className="h-7 w-7 grid place-items-center rounded border border-slate-300"
                        onClick={() => onIncrement(o.id)}
                        aria-label="Meer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        className="h-7 w-7 grid place-items-center rounded border border-slate-300 text-red-600"
                        onClick={() => onRemove(o.id)}
                        aria-label="Verwijderen"
                        title="Verwijderen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}

      <div className="pt-2 text-right text-xs text-slate-500">
        Totaal items: {totalItems}
      </div>
    </div>
  );
}
