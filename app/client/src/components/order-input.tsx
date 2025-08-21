import { useState } from "react";
import { Plus, Mic, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ProcessOrderResponse {
  success: boolean;
  orders: any[];
  message: string;
}

interface OrderInputProps {
  people: string[];
}

export default function OrderInput({ people }: OrderInputProps) {
  const [orderText, setOrderText] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const processOrderMutation = useMutation({
    mutationFn: async (text: string): Promise<ProcessOrderResponse> => {
      const response = await apiRequest("POST", "/api/chat", { text });
      return response.json();
    },
    onSuccess: (data) => {
      setOrderText("");
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Bestelling toegevoegd!",
        description: data.message,
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij verwerken bestelling",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderText.trim()) return;
    processOrderMutation.mutate(orderText.trim());
  };

  const clearInput = () => {
    setOrderText("");
  };

  const quickAddItems = people.length > 0 ? [
    { label: `${people[0]} bier`, text: `${people[0]} bier` },
    { label: `${people[0]} cola`, text: `${people[0]} cola` },
    ...(people.length > 1 ? [{ label: `${people.slice(0, 2).join(' en ')} pizza`, text: `${people.slice(0, 2).join(' en ')} pizza` }] : [])
  ] : [
    { label: "Voeg eerst mensen toe", text: "" }
  ];

  const handleQuickAdd = (text: string) => {
    if (text) setOrderText(text);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <Plus className="text-primary-500 text-lg" />
        <h2 className="text-lg font-semibold text-slate-800">Nieuwe Bestelling</h2>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <Label htmlFor="orderInput" className="block text-sm font-medium text-slate-700 mb-2">
              Voer bestelling in (bijv. "Timo en Bart een biertje en pizza")
            </Label>
            <div className="relative">
              <Input 
                id="orderInput"
                value={orderText}
                onChange={(e) => setOrderText(e.target.value)}
                placeholder="Bijv: Timo en Bart een biertje en pizza"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors placeholder-slate-400 pr-10"
                disabled={processOrderMutation.isPending}
              />
              {orderText && (
                <button 
                  type="button"
                  onClick={clearInput}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Button 
              type="submit"
              disabled={!orderText.trim() || processOrderMutation.isPending}
              className="flex-1 bg-primary-500 text-white font-medium py-3 px-4 rounded-lg hover:bg-primary-600 transition-colors focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <Plus className="mr-2" size={16} />
              {processOrderMutation.isPending ? "Verwerken..." : "Bestelling Toevoegen"}
            </Button>
            <Button 
              type="button"
              variant="outline"
              className="px-4 py-3 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Mic size={16} />
            </Button>
          </div>
        </div>
      </form>

      {/* Quick Add Suggestions */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-500 mb-2">Snelle toevoegingen:</p>
        <div className="flex flex-wrap gap-2">
          {quickAddItems.map((item) => (
            <button 
              key={item.label}
              onClick={() => handleQuickAdd(item.text)}
              className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full hover:bg-slate-200 transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
