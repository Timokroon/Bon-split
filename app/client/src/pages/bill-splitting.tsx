import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Receipt, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useOrders } from "@/hooks/use-orders";
import ReceiptUpload from "@/components/receipt-upload"; // 👈 BELANGRIJK: deze import ontbrak

export default function BillSplitting() {
  const [, setLocation] = useLocation();
  const { data: orders = [], people = [] } = useOrders();
  const { toast } = useToast();
  const [tipPercentage, setTipPercentage] = useState(0);

  const goBack = () => setLocation("/");

  const totalEstimated = useMemo(
    () => orders.reduce((sum, o) => sum + (o.price || 0) * (o.qty || 0), 0),
    [orders]
  );

  // Group by personName
  const ordersByUser = useMemo(() => {
    const acc: Record<
      string,
      { orders: typeof orders; total: number; color: string; initial: string }
    > = {};

    orders.forEach((o) => {
      const key = o.personName?.trim() || "Onbekend";
      if (!acc[key]) {
        const p = people.find(
          (pp) => pp.name.toLowerCase() === key.toLowerCase()
        );
        acc[key] = {
          orders: [],
          total: 0,
          color: p?.color || "bg-blue-500",
          initial: p?.initial || key.charAt(0).toUpperCase(),
        };
      }
      acc[key].orders.push(o as any);
      acc[key].total += (o.price || 0) * (o.qty || 0);
    });

    return acc;
  }, [orders, people]);

  const handleTipDistribution = (percentage: number) => {
    const tipAmount = totalEstimated * (percentage / 100);
    const persons = Math.max(1, Object.keys(ordersByUser).length);
    const perPersonTip = tipAmount / persons;

    toast({
      title: "Fooi verdeeld",
      description: `€${tipAmount.toFixed(2)} fooi (${percentage}%) verdeeld over ${persons} personen: €${perPersonTip.toFixed(2)} p.p.`,
    });

    setTipPercentage(percentage);
  };

  return (
    <div className="min-h-full bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                onClick={goBack}
                className="text-slate-600 hover:text-slate-800"
              >
                <ArrowLeft size={20} />
              </Button>
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Receipt className="text-white text-sm" size={16} />
              </div>
              <h1 className="text-xl font-bold text-slate-800">Rekening Verdelen</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: orders per persoon */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt size={20} />
                  Huidige Bestellingen
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(ordersByUser).length === 0 ? (
                  <p className="text-slate-500 text-center py-8">
                    Geen bestellingen gevonden. Ga terug en voeg bestellingen toe.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(ordersByUser).map(([userName, userData]) => (
                      <div key={userName} className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${userData.color}`}
                          >
                            {userData.initial}
                          </div>
                          <h3 className="font-semibold text-slate-800">{userName}</h3>
                        </div>
                        <div className="space-y-1 ml-11">
                          {userData.orders.map((order) => (
                            <div key={order.id} className="flex justify-between text-sm">
                              <span>{order.qty}x {order.label}</span>
                              <span>€{(((order.price || 0) * (order.qty || 0))).toFixed(2)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between font-semibold text-slate-800 border-t pt-1 mt-2">
                            <span>Subtotaal:</span>
                            <span>€{userData.total.toFixed(2)}</span>
                          </div>

                          {tipPercentage > 0 && (
                            <>
                              <div className="flex justify-between text-sm text-slate-600">
                                <span>Fooi ({tipPercentage}%):</span>
                                <span>
                                  €{(
                                    (totalEstimated * (tipPercentage / 100)) /
                                    Math.max(1, Object.keys(ordersByUser).length)
                                  ).toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between font-bold text-emerald-600 border-t pt-1">
                                <span>Totaal:</span>
                                <span>
                                  €{(
                                    userData.total +
                                    (totalEstimated * (tipPercentage / 100)) /
                                      Math.max(1, Object.keys(ordersByUser).length)
                                  ).toFixed(2)}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Fooi */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign size={20} />
                  Fooi Verdelen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    {[0, 10, 15, 20].map((percentage) => (
                      <Button
                        key={percentage}
                        variant={tipPercentage === percentage ? "default" : "outline"}
                        onClick={() => handleTipDistribution(percentage)}
                        className="flex-1"
                      >
                        {percentage === 0 ? "Geen fooi" : `${percentage}%`}
                      </Button>
                    ))}
                  </div>

                  {totalEstimated > 0 && (
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Totaal rekening:</span>
                        <span className="text-lg font-bold">
                          €{(totalEstimated + totalEstimated * (tipPercentage / 100)).toFixed(2)}
                        </span>
                      </div>
                      {tipPercentage > 0 && (
                        <div className="text-sm text-slate-600 mt-1">
                          Inclusief €{(totalEstimated * (tipPercentage / 100)).toFixed(2)} fooi
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: bon upload (optioneel) */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bon uploaden voor slimme verdeling</CardTitle>
                <p className="text-sm text-slate-600">
                  Upload een bon om de AI de kosten slim te laten verdelen op basis van jullie bestellingen.
                </p>
              </CardHeader>
              <CardContent>
                <ReceiptUpload />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
