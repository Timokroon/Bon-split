import { useEffect } from "react";
import { Input } from "./ui/input";
import { useRestaurant } from "../hooks/use-restaurant";

export default function Header() {
  const { name, setName } = useRestaurant();

  // (opt) bewaar in localStorage zodat het blijft staan bij refresh
  useEffect(() => {
    const saved = localStorage.getItem("restaurantName");
    if (saved && !name) setName(saved);
  }, []);
  useEffect(() => {
    localStorage.setItem("restaurantName", name || "");
  }, [name]);

  const title = name?.trim() ? name.trim() : "Group Order Splitter";

  return (
    <header className="mb-4">
      {/* GROTE TITEL */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>

        {/* RECHTSBOVEN: naam invoeren */}
        <div className="flex items-center gap-2">
          <Input
            className="w-64"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Restaurantnaam"
          />
        </div>
      </div>
    </header>
  );
}