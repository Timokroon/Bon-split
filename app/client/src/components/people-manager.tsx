import { useState } from "react";
import { Plus, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Person {
  id: string;
  name: string;
  initial: string;
  color: string;
}

interface PeopleManagerProps {
  people: Person[];
  onPeopleChange: (people: Person[]) => void;
}

const colors = [
  "bg-blue-500",
  "bg-green-500", 
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-yellow-500",
  "bg-red-500"
];

export default function PeopleManager({ people, onPeopleChange }: PeopleManagerProps) {
  const [newPersonName, setNewPersonName] = useState("");

  const addPerson = () => {
    if (!newPersonName.trim()) return;

    const newPerson: Person = {
      id: Math.random().toString(36).substr(2, 9),
      name: newPersonName.trim(),
      initial: newPersonName.trim().charAt(0).toUpperCase(),
      color: colors[people.length % colors.length]
    };

    onPeopleChange([...people, newPerson]);
    setNewPersonName("");
  };

  const removePerson = (personId: string) => {
    onPeopleChange(people.filter(p => p.id !== personId));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addPerson();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User size={20} />
          Mensen beheren
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add person */}
        <div className="flex gap-2">
          <Input
            placeholder="Naam van persoon..."
            value={newPersonName}
            onChange={(e) => setNewPersonName(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button 
            onClick={addPerson}
            disabled={!newPersonName.trim()}
            size="sm"
          >
            <Plus size={16} />
          </Button>
        </div>

        {/* People list */}
        <div className="space-y-2">
          {people.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4">
              Nog geen mensen toegevoegd
            </p>
          ) : (
            people.map((person) => (
              <div
                key={person.id}
                className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 ${person.color} rounded-full flex items-center justify-center text-white font-medium text-sm`}
                  >
                    {person.initial}
                  </div>
                  <span className="font-medium">{person.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePerson(person.id)}
                  className="text-slate-400 hover:text-red-500"
                >
                  <X size={16} />
                </Button>
              </div>
            ))
          )}
        </div>

        {people.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-sm text-slate-600">
              {people.length} {people.length === 1 ? 'persoon' : 'mensen'} toegevoegd
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}