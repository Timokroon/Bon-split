import { Input } from "@/components/ui/input";
import { useRestaurant } from "@/hooks/use-restaurant";

export default function Header() {
  const { name, setName } = useRestaurant();

  return (
    <header className="flex items-center justify-between py-4">
      <h1 className="text-xl font-semibold">Group Order Splitter</h1>
      <Input
        className="w-64"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Restaurantnaam"
      />
    </header>
  );
}
