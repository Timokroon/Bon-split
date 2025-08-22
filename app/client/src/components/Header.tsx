import { Receipt } from "lucide-react";
import { Input } from "./ui/input";
import { useRestaurant } from "../hooks/use-restaurant";

export default function Header() {
  const { name, setName } = useRestaurant();
  const title = name?.trim() ? name.trim() : "Group Order Splitter";

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 border border-slate-200 py-2 px-3 shadow-sm">
            <span className="inline-flex items-center justify-center rounded-full bg-blue-600 text-white w-6 h-6">
              <Receipt size={16} />
            </span>
            <span className="font-semibold text-slate-800">Group Order Splitter</span>
          </div>
          <Input
            className="w-48 sm:w-64"
            placeholder="Restaurantnaam"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <h1 className="mt-4 text-2xl md:text-3xl font-bold text-slate-900">
          {title}
        </h1>
      </div>
    </header>
  );
}
