import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import SearchPage from "./pages/SearchPage";
import BookDetail from "./pages/BookDetail";
import Library from "./pages/Library";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";
import { initializeBookStorage } from "./lib/bookStorage";

const queryClient = new QueryClient();

const App = () => {
  // Initialize IndexedDB and migrate from localStorage on app start
  useEffect(() => {
    initializeBookStorage().then(() => {
      console.log('[App] Book storage initialized');
    }).catch((error) => {
      console.error('[App] Failed to initialize book storage:', error);
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/book/:id" element={<BookDetail />} />
            <Route path="/library" element={<Library />} />
            <Route path="/account" element={<Account />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
