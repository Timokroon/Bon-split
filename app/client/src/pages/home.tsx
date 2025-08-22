import { useMemo, useState } from "react";

// Nieuwe header met grote titel + input rechtsboven
import Header from "../components/Header";

// Bestaande secties
import OrderInput from "../components/order-input";
import OrdersList from "../components/orders-list";
import ReceiptUpload from "../components/receipt-upload";

/**
 * Eenvoudige types zodat het compileert zonder jouw shared types.
 * Heb je al eigen types? Vervang deze gerust.
 */
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
   * Lokale state voor demo/MVP.
   * Als je al hooks/context gebruikt (bijv. useOrders, usePeople),
   * kun je die hier inzetten en deze useState’s verwijderen.
   */
  const [people, setPeople] = useState<Person[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const isLoading = false;

  const totalItems = useMemo(
    () => orders.reduce((sum, o) => sum + (o.qty ?? 0), 0),
    [orders]
  );

  return (
    <>
      {/* Topbalk met restaurantnaam-veld en grote titel */}
      <Header />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Linker kolom: invoer & beheer */}
          <div className="space-y-6">
            {/* Als jouw OrderInput extra props verwacht, voeg ze hier toe */}
            <OrderInput people={people} />

            <OrdersList
              orders={orders}
              totalItems={totalItems}
              isLoading={isLoading}
              people={people}
              onPeopleChange={setPeople}
              // Heb je in jouw component een setter voor orders?
              // Zet dan deze erbij en haal de comment weg:
              // onOrdersChange={setOrders}
            />
          </div>

          {/* Rechter kolom: bon uploaden */}
          <div className="space-y-6">
            <ReceiptUpload />
          </div>
        </div>
      </main>
    </>
  );
}