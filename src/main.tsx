import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import "./index.css";

import Landing from "./pages/Landing";
import ClientBooking from "./pages/ClientBooking";
import Auth from "./pages/Auth";
import AdminSettings from "./pages/AdminSettings";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            {/* Client booking pages */}
            <Route path="/book/:clientSlug" element={<ClientBooking />} />
            
            {/* Authentication */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Protected admin routes */}
            <Route path="/admin-settings" element={
              <ProtectedRoute>
                {(user) => (
                  <AdminProtectedRoute user={user}>
                    <AdminSettings />
                  </AdminProtectedRoute>
                )}
              </ProtectedRoute>
            } />
            
            {/* Landing page */}
            <Route path="/" element={<Landing />} />
            
            {/* 404 page */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  </StrictMode>
);