import React, { useMemo, useState } from "react";
import Header from "../components/Header";
import OrderInput from "../components/order-input";
import OrdersList from "../components/orders-list";
import ReceiptUpload from "../components/receipt-upload";

type Person = { id: string; name: string };
type Order = { id: string; label: string; qty: number; price?: number; personId?: string };

export default function Home() {
  const [people, setPeople] = useState<Person[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading] = useState(false);

  const totalItems = useMemo(
    () => orders.reduce((sum, o) => sum + (o.qty ?? 0), 0),
    [orders]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <OrderInput people={people} />
            <OrdersList
              orders={orders}
              totalItems={totalItems}
              isLoading={isLoading}
              people={people}
              onPeopleChange={setPeople}
            />
          </div>
          <div className="space-y-6">
            <ReceiptUpload />
          </div>
        </div>
      </main>
    </div>
  );
}
