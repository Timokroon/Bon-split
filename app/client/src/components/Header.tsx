import { Input } from "@/components/ui/input";
import { useRestaurant } from "@/hooks/use-restaurant";

export default function Header() {
  const { name, setName } = useRestaurant();

  return (
    <header className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
        
        {/* Logo + Titel */}
        <div className="flex items-center space-x-3">
          <img src="/logo.svg" alt="Logo" className="h-8 w-8" />
          <h1 className="text-xl font-bold text-slate-800">Group Order Splitter</h1>
        </div>

        {/* Restaurantnaam input */}
        <div>
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