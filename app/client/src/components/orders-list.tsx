import { useState } from "react";
import { Minus, Plus, List, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

import { Order, updateOrder, deleteOrder } from "@/hooks/use-orders";

type OrdersListProps = {
  orders: Order[];
  totalItems: number;
  isLoading: boolean;
  people: string[];
  onPeopleChange: (people: string[]) => void;
};

export default function OrdersList({
  orders,
  totalItems,
  isLoading,
  people,
  onPeopleChange,
}: OrdersListProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateOrderMutation = useMutation({
    mutationFn: updateOrder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
    onError: () =>
      toast({ title: "Fout", description: "Kon bestelling niet updaten" }),
  });

  const deleteOrderMutation = useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
    onError: () =>
      toast({ title: "Fout", description: "Kon bestelling niet verwijderen" }),
  });

  // Naam wijzigen
  const handleRenamePerson = async (userId: string, currentName: string) => {
    const newName = prompt("Nieuwe naam voor " + currentName, currentName);
    if (!newName || newName.trim() === "" || newName === currentName) return;
    for (const order of orders.filter((o) => o.userId === userId)) {
      await updateOrderMutation.mutateAsync({
        ...order,
        userName: newName,
        userInitial: newName.charAt(0).toUpperCase(),
      });
    }
  };

  // Persoon verwijderen
  const handleDeletePerson = async (userId: string) => {
    if (!confirm("Weet je zeker dat je deze persoon wilt verwijderen?")) return;
    for (const order of orders.filter((o) => o.userId === userId)) {
      await deleteOrderMutation.mutateAsync(order.id);
    }
  };

  // Orders groeperen per persoon
  const groupedOrders: Record<
    string,
    { userName: string; userInitial: string; orders: Order[] }
  > = {};
  for (const order of orders) {
    if (!groupedOrders[order.userId]) {
      groupedOrders[order.userId] = {
        userName: order.userName,
        userInitial: order.userInitial,
        orders: [],
      };
    }
    groupedOrders[order.userId].orders.push(order);
  }

  // Items sorteren: drankjes eerst
  const sortItems = (items: Order[]) =>
    [...items].sort((a, b) => {
      const drinkKeywords = ["bier", "cola", "wijn", "water"];
      const aDrink = drinkKeywords.some((k) =>
        a.itemName.toLowerCase().includes(k)
      );
      const bDrink = drinkKeywords.some((k) =>
        b.itemName.toLowerCase().includes(k)
      );
      if (aDrink && !bDrink) return -1;
      if (!aDrink && bDrink) return 1;
      return a.itemName.localeCompare(b.itemName);
    });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <List className="text-emerald-500 w-5 h-5" />
          <h2 className="text-lg font-semibold">Huidige Bestellingen</h2>
        </div>
        <span className="px-2 py-1 text-xs font-medium bg-slate-100 rounded-full">
          {totalItems} items
        </span>
      </div>

      {Object.entries(groupedOrders).map(([userId, group]) => (
        <ContextMenu key={userId}>
          <ContextMenuTrigger asChild>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 mb-3">
              <div className="flex items-center space-x-3 mb-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-300 text-white"
                >
                  {group.userInitial}
                </div>
                <span className="font-medium">{group.userName}</span>
              </div>
              <div className="space-y-1 ml-11">
                {sortItems(group.orders).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between"
                  >
                    <span>
                      {order.quantity}× {order.itemName}
                    </span>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          updateOrderMutation.mutate({
                            ...order,
                            quantity: order.quantity - 1,
                          })
                        }
                        disabled={order.quantity <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          updateOrderMutation.mutate({
                            ...order,
                            quantity: order.quantity + 1,
                          })
                        }
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem
              onClick={() => handleRenamePerson(userId, group.userName)}
            >
              Naam wijzigen
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => handleDeletePerson(userId)}
              className="text-red-600"
            >
              Persoon verwijderen
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      ))}
    </div>
  );
}
