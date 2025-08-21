import { useQuery } from "@tanstack/react-query";
import { type Order } from "@shared/schema";

export function useOrders() {
  return useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });
}
