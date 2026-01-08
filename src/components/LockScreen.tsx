// src/components/LockScreen.tsx
"use client";
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full bg-background/80 backdrop-blur-2xl flex flex-col items-center justify-center cursor-pointer"
      onClick={onUnlock}
    >
      <div className="relative">
        {/* Blob Animation */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            borderRadius: ["40%", "50%", "40%"]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-primary/20 blur-3xl w-64 h-64 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2"
        />
        
        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
            <Lock className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold">Session Locked</h2>
            <p className="text-muted-foreground mt-2">Click anywhere to unlock and resume</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}