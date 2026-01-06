import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function LockScreen() {
  const { user, unlock, logout } = useAuth();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await unlock(password);
    
    if (!result.success) {
      setError(result.error || 'Invalid password');
      setPassword('');
    }
    
    setLoading(false);
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
            Welcome back, {user?.name}. Enter your password to continue.
          </p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-2 p-3 mb-4 rounded-lg bg-destructive/10 text-destructive"
            >
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Unlocking...' : 'Unlock'}
            </Button>
          </form>

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
