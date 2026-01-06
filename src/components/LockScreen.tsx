import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export function LockScreen() {
  const { user, unlock, logout } = useAuth();

  // Blob animation values
  const [blobPositions, setBlobPositions] = useState([
    { x: 20, y: 30 },
    { x: 70, y: 60 },
    { x: 40, y: 80 },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBlobPositions([
        { x: Math.random() * 60 + 10, y: Math.random() * 60 + 10 },
        { x: Math.random() * 60 + 20, y: Math.random() * 60 + 20 },
        { x: Math.random() * 60 + 15, y: Math.random() * 60 + 15 },
      ]);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleUnlock = () => {
    unlock();
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-md z-[100] flex items-center justify-center">
      {/* Animated Blobs */}
      {blobPositions.map((pos, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl pointer-events-none"
          style={{
            background: `hsl(var(--primary) / ${0.15 - i * 0.03})`,
            width: `${200 + i * 100}px`,
            height: `${200 + i * 100}px`,
          }}
          animate={{
            x: `${pos.x}vw`,
            y: `${pos.y}vh`,
          }}
          transition={{
            duration: 8 + i * 2,
            ease: 'easeInOut',
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        />
      ))}

      {/* Lock Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-sm mx-4"
      >
        <div className="glass-card rounded-2xl p-8 text-center">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center"
          >
            <Lock className="w-8 h-8 text-primary" />
          </motion.div>

          <h2 className="text-xl font-bold text-foreground mb-1">Session Locked</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Welcome back, {user?.name}. Click to continue.
          </p>

          <Button onClick={handleUnlock} className="w-full" size="lg">
            Click to Unlock
          </Button>

          <button
            onClick={logout}
            className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign out and switch account
          </button>
        </div>
      </motion.div>
    </div>
  );
}
