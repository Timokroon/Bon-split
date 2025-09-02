// app/client/src/pages/home.tsx
import * as React from "react";

import OrderInput from "../components/order-input";
import OrdersList from "../components/orders-list";
import ReceiptUpload from "../components/receipt-upload";
import PeopleManager, { Person } from "../components/people-manager";
import { onAddOrder, type AddOrderPayload } from "../lib/order-bus";

export type OrderItem = {
  id: string;
  label: string;
  qty: number;
  personName?: string;
  price?: number;
};

export default function Home() {
  // Personen als Person[]
  const [people, setPeople] = React.useState<Person[]>([]);

  // Huidige bestellingen (lokaal)
  const [orders, setOrders] = React.useState<OrderItem[]>([]);

  // totalen
  const totalItems = React.useMemo(
    () => orders.reduce((s, o) => s + (o.qty || 0), 0),
    [orders]
  );

  // ± en verwijderen
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

  // Luister naar OrderInput → onAddOrder (met type-annotatie)
  React.useEffect(() => {
    const off = onAddOrder(
      ({ label, qty = 1, personName, price }: AddOrderPayload) => {
        const id = crypto.randomUUID();
        setOrders((prev) => [
          ...prev,
          {
            id,
            label: label.trim(),
            qty: Math.max(1, qty),
            personName,
            price,
          },
        ]);
      }
    );
    return off;
  }, []);

  // Header: restaurantnaam met localStorage
  const [restaurantName, setRestaurantName] = React.useState("");
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("restaurantName");
      if (saved) setRestaurantName(saved);
    } catch {}
  }, []);
  React.useEffect(() => {
    try {
      localStorage.setItem("restaurantName", restaurantName);
    } catch {}
  }, [restaurantName]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Enkele header (A1) */}
      <header className="bg-white shadow-sm border-b border-slate-200">
  <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
    <div className="flex items-center gap-3">
      {/* Logo: blauwe cirkel met euroteken */}
      <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
        €
      </div>
      {/* App-naam aanpassen hier */}
      <h1 className="text-xl font-bold text-slate-800">Bill Splitter</h1>
    </div>
  </div>
</header>


      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Links */}
          <section className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">
                Nieuwe Bestelling
              </h2>
              <OrderInput people={people} />
              <div className="mt-4 text-xs text-slate-500">
                Snelle toevoegingen verschijnen direct hieronder.
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">
                Personen beheren
              </h2>
              <PeopleManager people={people} onPeopleChange={setPeople} />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">
                  Huidige Bestellingen
                </h2>
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
          </section>

          {/* Rechts */}
          <section>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">
                Bon Uploaden
              </h2>
              <ReceiptUpload />
              <div className="mt-6">
                <button className="w-full rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5">
                  Afronden & Rekening Verdelen
                </button>
                <p className="mt-2 text-xs text-slate-500">
                  Ga naar het verdeelscherm om kosten op te splitsen.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
