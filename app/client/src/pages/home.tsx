import * as React from "react";
import OrderInput from "../components/order-input";
import OrdersList from "../components/orders-list";
import ReceiptUpload from "../components/receipt-upload";
import PeopleManager, { Person } from "../components/people-manager";
import { onAddOrder, type AddOrderPayload } from "../lib/order-bus";
import { User, PlusCircle, List as ListIcon } from "lucide-react";

export type OrderItem = {
  id: string;
  label: string;
  qty: number;
  personName?: string;
  price?: number;
};

export default function Home() {
  const [people, setPeople] = React.useState<Person[]>([]);
  const [orders, setOrders] = React.useState<OrderItem[]>([]);

  // INIT: laad uit localStorage (éénmalig)
  React.useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem("peopleV1") || "[]");
      if (Array.isArray(p) && p.length) setPeople(p);
    } catch {}
    try {
      const o = JSON.parse(localStorage.getItem("ordersV1") || "[]");
      if (Array.isArray(o) && o.length) setOrders(o);
    } catch {}
  }, []);

  // PERSIST + broadcast bij wijzigingen
  React.useEffect(() => {
    try {
      localStorage.setItem("peopleV1", JSON.stringify(people));
      window.dispatchEvent(new Event("ordersUpdated"));
    } catch {}
  }, [people]);

  React.useEffect(() => {
    try {
      localStorage.setItem("ordersV1", JSON.stringify(orders));
      window.dispatchEvent(new Event("ordersUpdated"));
    } catch {}
  }, [orders]);

  const totalItems = React.useMemo(
    () => orders.reduce((s, o) => s + (o.qty || 0), 0),
    [orders]
  );

  const ensurePerson = React.useCallback(
    (name: string): Person => {
      const trimmed = name.trim();
      const found = people.find(
        (p) => p.name.toLowerCase() === trimmed.toLowerCase()
      );
      if (found) return found;
      const newP: Person = {
        id: crypto.randomUUID(),
        name: trimmed,
        initial: trimmed.charAt(0).toUpperCase(),
        color: "bg-blue-500",
      };
      setPeople((prev) => [...prev, newP]);
      return newP;
    },
    [people]
  );

  const updateQty = (id: string, delta: number) => {
    setOrders((prev) =>
      prev
        .map((o) =>
          o.id === id ? { ...o, qty: Math.max(0, (o.qty || 0) + delta) } : o
        )
        .filter((o) => o.qty > 0)
    );
  };
  const removeOrder = (id: string) =>
    setOrders((prev) => prev.filter((o) => o.id !== id));

  React.useEffect(() => {
    const off = onAddOrder(
      ({ label, qty = 1, personName, price }: AddOrderPayload) => {
        let assigned = personName?.trim() || undefined;
        if (assigned) {
          const p = ensurePerson(assigned);
          assigned = p.name;
        }
        const id = crypto.randomUUID();
        setOrders((prev) => [
          ...prev,
          {
            id,
            label: label.trim(),
            qty: Math.max(1, qty),
            personName: assigned,
            price,
          },
        ]);
      }
    );
    return off;
  }, [ensurePerson]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
              €
            </div>
            <h1 className="text-xl font-bold text-slate-800">Group Splitter</h1>
          </div>
        </div>
      </header>

      {/* 3 kolommen */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Kolom 1: NIEUWE BESTELLING + MENSEN */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-semibold text-slate-800">
                  Nieuwe Bestelling
                </h2>
              </div>
              <OrderInput people={people} />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-5 h-5 text-slate-700" />
                <h2 className="text-lg font-semibold text-slate-800">
                  Mensen toevoegen
                </h2>
              </div>
              <PeopleManager people={people} onPeopleChange={setPeople} />
            </div>
          </div>

          {/* Kolom 2: HUIDIGE BESTELLINGEN */}
          <div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListIcon className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-slate-800">
                    Huidige Bestellingen
                  </h2>
                </div>
                <span className="text-xs text-slate-500">{totalItems} items</span>
              </div>

              <div className="mt-3">
                <OrdersList
                  orders={orders}
                  totalItems={totalItems}
                  isLoading={false}
                  onIncrement={(id) => updateQty(id, +1)}
                  onDecrement={(id) => updateQty(id, -1)}
                  onRemove={removeOrder}
                  people={people}
                />
              </div>
            </div>
          </div>

          {/* Kolom 3: BON UPLOADEN */}
          <div>
            <ReceiptUpload />
          </div>
        </div>
      </main>
    </div>
  );
}
