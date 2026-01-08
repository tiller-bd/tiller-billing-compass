// src/app/not-found.tsx
"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FileQuestion, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Animation */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -z-10"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6 max-w-md"
      >
        <div className="w-24 h-24 bg-muted rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
          <FileQuestion className="w-12 h-12 text-muted-foreground" />
        </div>
        
        <h1 className="text-4xl font-bold tracking-tight">Page Not Found</h1>
        <p className="text-muted-foreground text-lg">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="pt-4">
          <Link href="/">
            <Button className="gap-2 px-8 py-6 text-lg">
              <ChevronLeft className="w-5 h-5" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}