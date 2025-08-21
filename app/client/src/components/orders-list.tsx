import { useCallback } from "react";
import { Minus, Plus, List } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

type Order = {
  id: string;
  userId: string;
  userName: string;
  userInitial: string;
  itemName: string;
  quantity: number;
};

type Props = {
  orders: Order[];
  totalItems: number;
  isLoading: boolean;
  people: string[];                 // niet gebruikt, blijft voor compat
  onPeopleChange: (p: string[]) => void; // idem
};

// Kleine helper om drankjes bovenaan te zetten
function sortItems(items: Order[]) {
  const drink = ["bier", "cola", "wijn", "water", "spa", "fris"];
  return [...items].sort((a, b) => {
    const ad = drink.some((k) => a.itemName.toLowerCase().includes(k));
    const bd = drink.some((k) => b.itemName.toLowerCase().includes(k));
    if (ad && !bd) return -1;
    if (!ad && bd) return 1;
    return a.itemName.localeCompare(b.itemName);
  });
}

export default function OrdersList({
  orders,
  totalItems,
}: Props) {
  const qc = useQueryClient();

  const refetch = useCallback(
    () => qc.invalidateQueries({ queryKey: ["/api/orders"] }),
    [qc]
  );

  // API helpers (zonder extra hooks)
  async function patchOrder(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("PATCH failed");
  }
  async function deleteOrder(id: string) {
    const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("DELETE failed");
  }

  async function dec(order: Order) {
    if (order.quantity <= 1) return;
    await patchOrder(order.id, { quantity: order.quantity - 1 });
    await refetch();
  }
  async function inc(order: Order) {
    await patchOrder(order.id, { quantity: order.quantity + 1 });
    await refetch();
  }

  // Langdruk-acties: naam wijzigen / persoon verwijderen
  async function renamePerson(userId: string, current: string) {
    const name = prompt("Nieuwe naam", current);
    if (!name || name.trim() === "" || name === current) return;
    const initial = name.trim().charAt(0).toUpperCase();
    const mine = orders.filter((o) => o.userId === userId);
    for (const o of mine) {
      await patchOrder(o.id, { userName: name.trim(), userInitial: initial });
    }
    await refetch();
  }
  async function removePerson(userId: string) {
    if (!confirm("Deze persoon en alle bestellingen verwijderen?")) return;
    const mine = orders.filter((o) => o.userId === userId);
    for (const o of mine) await deleteOrder(o.id);
    await refetch();
  }

  // Groepeer per persoon
  const byUser: Record<string, { name: string; initial: string; items: Order[] }> = {};
  for (const o of orders) {
    if (!byUser[o.userId]) byUser[o.userId] = { name: o.userName, initial: o.userInitial, items: [] };
    byUser[o.userId].items.push(o);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <List className="w-5 h-5 text-emerald-500" />
          <h2 className="text-lg font-semibold">Huidige Bestellingen</h2>
        </div>
        <span className="px-2 py-1 text-xs font-medium bg-slate-100 rounded-full">
          {totalItems} items
        </span>
      </div>

      {Object.entries(byUser).map(([userId, group]) => (
        <div key={userId} className="p-3 bg-slate-50 rounded-lg border border-slate-100 mb-3">
          <button
            className="flex items-center gap-3 mb-2 group"
            onContextMenu={(e) => {
              e.preventDefault();
              // fallback voor iPad: contextmenu via prompt
              const choice = prompt("Actie: typ 'naam' of 'verwijderen'", "naam");
              if (!choice) return;
              if (choice.toLowerCase().startsWith("ver")) removePerson(userId);
              else renamePerson(userId, group.name);
            }}
            onPointerDown={(e) => {
              // long-press (800ms) om menu te simuleren op touch
              let timeout: number | undefined;
              const target = e.currentTarget;
              const up = () => {
                if (timeout) window.clearTimeout(timeout);
                target.removeEventListener("pointerup", up);
                target.removeEventListener("pointerleave", up);
              };
              target.addEventListener("pointerup", up);
              target.addEventListener("pointerleave", up);
              // @ts-ignore
              timeout = window.setTimeout(() => {
                up();
                const choice = prompt("Actie: typ 'naam' of 'verwijderen'", "naam");
                if (!choice) return;
                if (choice.toLowerCase().startsWith("ver")) removePerson(userId);
                else renamePerson(userId, group.name);
              }, 800);
            }}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-300 text-white">
              {group.initial}
            </div>
            <span className="font-medium">{group.name}</span>
          </button>

          <div className="space-y-1 ml-11">
            {sortItems(group.items).map((o) => (
              <div key={o.id} className="flex items-center justify-between">
                <span>{o.quantity}× {o.itemName}</span>
                <div className="flex items-center gap-2">
                  <button
                    className="px-2 py-1 rounded border border-slate-300 disabled:opacity-50"
                    onClick={() => dec(o)}
                    disabled={o.quantity <= 1}
                    aria-label="Minder"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button
                    className="px-2 py-1 rounded border border-slate-300"
                    onClick={() => inc(o)}
                    aria-label="Meer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
