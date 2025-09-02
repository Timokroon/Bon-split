import { useState } from "react";
import { Plus, X } from "lucide-react";

export interface Person {
  id: string;
  name: string;
  initial: string;
  color: string;
}

type Props = {
  people: Person[];
  onPeopleChange: (people: Person[]) => void;
};

const COLORS = [
  "bg-blue-500","bg-emerald-500","bg-purple-500","bg-orange-500",
  "bg-pink-500","bg-cyan-500","bg-yellow-500","bg-red-500",
];

export default function PeopleManager({ people, onPeopleChange }: Props) {
  const [name, setName] = useState("");

  const add = () => {
    const n = name.trim();
    if (!n) return;
    if (people.some(p => p.name.toLowerCase() === n.toLowerCase())) {
      setName("");
      return;
    }
    const person: Person = {
      id: crypto.randomUUID(),
      name: n,
      initial: n.charAt(0).toUpperCase(),
      color: COLORS[people.length % COLORS.length],
    };
    onPeopleChange([...people, person]);
    setName("");
  };

  const remove = (id: string) => onPeopleChange(people.filter(p => p.id !== id));

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          placeholder="Naam"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button
          onClick={add}
          className="h-9 w-9 inline-flex items-center justify-center rounded-md bg-slate-800 text-white hover:bg-slate-900"
          aria-label="Persoon toevoegen"
          title="Persoon toevoegen"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {people.map((p) => (
          <span
            key={p.id}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 pl-2 pr-1 py-1 text-sm bg-white"
            title={p.name}
          >
            <span className={`w-6 h-6 rounded-full ${p.color} text-white grid place-items-center text-xs`}>
              {p.initial}
            </span>
            {p.name}
            <button
              className="ml-1 rounded-full p-1 hover:bg-slate-100"
              aria-label={`Verwijder ${p.name}`}
              onClick={() => remove(p.id)}
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </span>
        ))}
        {people.length === 0 && (
          <span className="text-sm text-slate-500">Nog geen mensen toegevoegd</span>
        )}
      </div>
    </div>
  );
}
