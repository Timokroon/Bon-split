import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Pas deze imports aan naar jouw paden als ze anders heten:
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/toaster";

// Render de Home-pagina direct
import Home from "./pages/home";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Home />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}