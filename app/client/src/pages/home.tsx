import React, { useMemo, useState } from "react";

// Bovenbalk met logo/tekst + restaurantnaam input (staat in: client/src/components/Header.tsx)
import Header from "../components/Header";

// Jouw bestaande secties (pad is relatief, geen alias gedoe)
import OrderInput from "../components/order-input";
import OrdersList from "../components/orders-list";
import ReceiptUpload from "../components/receipt-upload";

/** Eenvoudige types zodat het zonder extra imports compileert. */
type Person = { id: string; name: string };
type Order = {
  id: string;
  label: string;
  qty: number;
  price?: number;
  personId?: string;
};

export default function Home() {
  /**
   * Lokale state voor MVP.
   * Heb je al globale hooks/stores (usePeople/useOrders)? Vervang deze setState dan later 1‑op‑1.
   */
  const [people, setPeople] = useState<Person[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading] = useState(false);

  const totalItems = useMemo(
    () => orders.reduce((sum, o) => sum + (o.qty ?? 0), 0),
    [orders]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ===== Top header (logo + titel links, restaurantnaam input rechts) ===== */}
      <Header />

      {/* ===== Main Content ===== */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Linker kolom: invoer & beheer */}
          <div className="space-y-6">
            {/* TIP: als jouw OrderInput meer props verwacht, vul ze hier aan */}
            <OrderInput people={people} />

            {/* OrdersList: toon huidige bestellingen; pas props aan als jouw component dat vraagt */}
            <OrdersList
              orders={orders}
              totalItems={totalItems}
              isLoading={isLoading}
              people={people}
              onPeopleChange={setPeople}
              // Heb je in jouw OrdersList een setter voor orders?
              // Haal de comment weg zodra je die prop hebt:
              // onOrdersChange={setOrders}
            />
          </div>

          {/* Rechter kolom: bon uploaden / OCR */}
          <div className="space-y-6">
            <ReceiptUpload />
          </div>
        </div>
      </main>
    </div>
  );
}