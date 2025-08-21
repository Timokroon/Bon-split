import { Receipt, Users } from "lucide-react";
import { useState } from "react";
import OrderInput from "@/components/order-input";
import OrdersList from "@/components/orders-list";
import ReceiptUpload from "@/components/receipt-upload";
import { useOrders } from "@/hooks/use-orders";

export default function Home() {
  const { data: orders = [], isLoading } = useOrders();
  const [people, setPeople] = useState<string[]>([]);
  
  const activeUsers = people.length;
  const totalItems = orders.reduce((sum, order) => sum + order.quantity, 0);

  return (
    <div className="min-h-full bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <Receipt className="text-white text-sm" size={16} />
              </div>
              <h1 className="text-xl font-bold text-slate-800">Group Order Splitter</h1>
            </div>
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <Users className="text-emerald-500" size={16} />
              <span>{activeUsers} personen</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Order Input & Management */}
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

          {/* Right Column: Receipt Upload */}
          <div className="space-y-6">
            <ReceiptUpload />
          </div>
        </div>
      </main>
    </div>
  );
}
