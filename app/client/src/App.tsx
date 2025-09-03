import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch } from "wouter";

// UI helpers
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/toaster";

// Pagina’s
import Home from "./pages/home";
import BillSplitting from "./pages/bill-splitting"; // 👈 zorg dat dit bestand bestaat

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/bill-splitting" component={BillSplitting} />
          <Route>
            {/* fallback voor 404 */}
            <div className="min-h-screen grid place-items-center text-slate-700">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Pagina niet gevonden</h1>
                <a href="/" className="text-blue-600 underline">
                  ← Terug naar start
                </a>
              </div>
            </div>
          </Route>
        </Switch>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
