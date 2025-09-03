import { useEffect, useState } from "react";

// Zelfde shape als Home
export type OrderItem = {
  id: string;
  label: string;
  qty: number;
  personName?: string;
  price?: number;
};

export type Person = {
  id: string;
  name: string;
  initial: string;
  color: string; // Tailwind kleurklasse
};

type Result = {
  data: OrderItem[];
  people: Person[];
};

export function useOrders(): Result {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [people, setPeople] = useState<Person[]>([]);

  const load = () => {
    try {
      const o = JSON.parse(localStorage.getItem("ordersV1") || "[]");
      const p = JSON.parse(localStorage.getItem("peopleV1") || "[]");
      if (Array.isArray(o)) setOrders(o);
      if (Array.isArray(p)) setPeople(p);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    load(); // initial
    const onUpdate = () => load();
    window.addEventListener("ordersUpdated", onUpdate);
    window.addEventListener("storage", onUpdate); // cross-tab support
    return () => {
      window.removeEventListener("ordersUpdated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  return { data: orders, people };
}
