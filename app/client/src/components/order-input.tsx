import { useState } from "react";
import { Plus, Mic, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { emitAddOrder } from "../lib/order-bus";
import type { Person } from "./people-manager";

interface ProcessOrderResponse {
  success: boolean;
  orders: any[];
  message: string;
}

type Props = { people: Person[] };

function parseLine(text: string, people: Person[]): { personName?: string; itemLabel: string } {
  const raw = text.trim();
  const match = raw.match(/^(\S+)\s+(.+)$/); // "naam rest"
  if (!match) return { itemLabel: raw };
  const candidate = match[1];
  const rest = match[2].trim();
  if (!rest) return { itemLabel: raw };
  const found = people.find(p => p.name.toLowerCase() === candidate.toLowerCase());
  return { personName: found ? found.name : candidate, itemLabel: rest };
}

export default function OrderInput({ people }: Props) {
  const [text, setText] = useState("");
  const { toast } = useToast();
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (t: string): Promise<ProcessOrderResponse> => {
      const res = await apiRequest("POST", "/api/chat", { text: t });
      return res.json();
    },
    onSuccess: (data) => {
      setText("");
      qc.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Bestelling toegevoegd!", description: data.message });
    },
  });

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const t = text.trim();
    if (!t) return;
    const parsed = parseLine(t, people);
    emitAddOrder({ label: parsed.itemLabel, qty: 1, personName: parsed.personName });
    mutation.mutate(t); // backend mag later AI doen
  };

  return (
    <div>
      <form onSubmit={submit} className="space-y-3">
        <div className="relative">
          <input
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none pr-10"
            placeholder='Bijv: "Timo bier" of "Bart pizza"'
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit(e)}
            disabled={mutation.isPending}
          />
          {text && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              onClick={() => setText("")}
              aria-label="Leegmaken"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary-500 px-4 py-3 text-white hover:bg-primary-600"
            disabled={!text.trim() || mutation.isPending}
          >
            <Plus className="w-4 h-4" />
            Bestelling toevoegen
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-3 text-slate-600 hover:bg-slate-50"
            aria-label="Spraak (later)"
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Snelle toevoegingen (klein en op 1 regel) */}
      <div className="mt-3 flex flex-wrap gap-2">
        {(people[0]?.name ? [`${people[0].name} bier`, `${people[0].name} cola`] : []).map((q) => (
          <button
            key={q}
            onClick={() => setText(q)}
            className="text-xs rounded-full bg-slate-100 px-3 py-1 hover:bg-slate-200"
          >
            {q}
          </button>
        ))}
        {people.length === 0 && (
          <span className="text-xs text-slate-500">Voeg eerst mensen toe</span>
        )}
      </div>
    </div>
  );
}
