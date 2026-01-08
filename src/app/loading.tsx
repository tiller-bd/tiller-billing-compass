// src/app/loading.tsx
"use client";

import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6 w-full animate-in fade-in duration-500">
      {/* Page Title Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-4 w-[400px]" />
      </div>

      {/* Filter Bar Skeleton */}
      <div className="glass-card p-4 rounded-xl border border-border/50">
        <div className="flex flex-col md:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-[150px]" />
          <Skeleton className="h-10 w-[150px]" />
        </div>
      </div>

      {/* Content Table Skeleton */}
      <div className="glass-card rounded-xl border border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border/50">
          <Skeleton className="h-6 w-[100px]" />
        </div>
        <div className="p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[80%]" />
              </div>
              <Skeleton className="h-8 w-[80px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}