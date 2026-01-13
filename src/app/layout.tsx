"use client"; // Required because of the Providers logic

import { Inter } from "next/font/google";
import "@/index.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { SharedFilterProvider } from "@/contexts/FilterContext"; // Import SharedFilterProvider
import { useState } from "react";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <SharedFilterProvider> {/* Wrap with SharedFilterProvider */}
              <TooltipProvider>
                {children}
                <Toaster />
                <Sonner />
              </TooltipProvider>
            </SharedFilterProvider>
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}