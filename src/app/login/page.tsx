// src/app/login/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff, AlertCircle, TrendingUp, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import tillerLogo from '@/assets/images/tiller.jpeg';

// Animated background component with financial theme
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-teal-50/30 to-cyan-50/50" />

      {/* Animated SVG Background */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Gradient definitions */}
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(173, 80%, 36%)" stopOpacity="0.1" />
            <stop offset="50%" stopColor="hsl(173, 80%, 36%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(173, 80%, 36%)" stopOpacity="0.1" />
          </linearGradient>

          <linearGradient id="chartGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="hsl(173, 80%, 36%)" stopOpacity="0.05" />
            <stop offset="100%" stopColor="hsl(173, 80%, 36%)" stopOpacity="0.2" />
          </linearGradient>

          <linearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(173, 80%, 50%)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(190, 70%, 50%)" stopOpacity="0.1" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Grid pattern */}
        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="hsl(173, 80%, 36%)" strokeOpacity="0.05" strokeWidth="1"/>
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Animated chart line 1 - Rising trend */}
        <motion.path
          d="M0,400 Q200,380 400,300 T800,200 T1200,150 T1600,100 T2000,50"
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="2"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 3, ease: "easeInOut", repeat: Infinity, repeatType: "loop", repeatDelay: 2 }}
        />

        {/* Animated chart line 2 */}
        <motion.path
          d="M0,500 Q150,450 300,480 T600,350 T900,400 T1200,300 T1500,320 T1800,200"
          fill="none"
          stroke="hsl(173, 80%, 36%)"
          strokeOpacity="0.15"
          strokeWidth="1.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 4, ease: "easeInOut", delay: 0.5, repeat: Infinity, repeatType: "loop", repeatDelay: 2 }}
        />

        {/* Area under chart */}
        <motion.path
          d="M0,600 L0,450 Q200,400 400,420 T800,350 T1200,380 T1600,300 L1600,600 Z"
          fill="url(#chartGradient)"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2, ease: "easeOut" }}
        />

        {/* Floating circles - data points */}
        {[
          { cx: "15%", cy: "20%", r: 4, delay: 0 },
          { cx: "25%", cy: "35%", r: 3, delay: 0.5 },
          { cx: "45%", cy: "25%", r: 5, delay: 1 },
          { cx: "65%", cy: "40%", r: 3, delay: 1.5 },
          { cx: "80%", cy: "30%", r: 4, delay: 2 },
          { cx: "90%", cy: "50%", r: 3, delay: 2.5 },
          { cx: "10%", cy: "60%", r: 4, delay: 3 },
          { cx: "35%", cy: "70%", r: 3, delay: 3.5 },
          { cx: "55%", cy: "65%", r: 5, delay: 4 },
          { cx: "75%", cy: "75%", r: 4, delay: 4.5 },
        ].map((circle, i) => (
          <motion.circle
            key={i}
            cx={circle.cx}
            cy={circle.cy}
            r={circle.r}
            fill="hsl(173, 80%, 36%)"
            fillOpacity="0.2"
            filter="url(#glow)"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3,
              delay: circle.delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}

        {/* Animated bars - like a bar chart */}
        {[
          { x: "5%", height: 80, delay: 0 },
          { x: "10%", height: 120, delay: 0.2 },
          { x: "15%", height: 60, delay: 0.4 },
          { x: "20%", height: 140, delay: 0.6 },
          { x: "25%", height: 100, delay: 0.8 },
        ].map((bar, i) => (
          <motion.rect
            key={i}
            x={bar.x}
            y={`calc(100% - ${bar.height}px)`}
            width="30"
            height={bar.height}
            fill="hsl(173, 80%, 36%)"
            fillOpacity="0.08"
            rx="4"
            initial={{ scaleY: 0, originY: 1 }}
            animate={{ scaleY: 1 }}
            transition={{
              duration: 1,
              delay: bar.delay,
              ease: "easeOut"
            }}
          />
        ))}

        {/* Right side decorative bars */}
        {[
          { x: "75%", height: 100, delay: 0.1 },
          { x: "80%", height: 150, delay: 0.3 },
          { x: "85%", height: 80, delay: 0.5 },
          { x: "90%", height: 180, delay: 0.7 },
          { x: "95%", height: 120, delay: 0.9 },
        ].map((bar, i) => (
          <motion.rect
            key={`right-${i}`}
            x={bar.x}
            y={`calc(100% - ${bar.height}px)`}
            width="25"
            height={bar.height}
            fill="hsl(190, 70%, 40%)"
            fillOpacity="0.06"
            rx="4"
            initial={{ scaleY: 0, originY: 1 }}
            animate={{ scaleY: 1 }}
            transition={{
              duration: 1,
              delay: bar.delay + 0.5,
              ease: "easeOut"
            }}
          />
        ))}

        {/* Connecting lines between points */}
        <motion.line
          x1="15%" y1="20%" x2="25%" y2="35%"
          stroke="hsl(173, 80%, 36%)"
          strokeOpacity="0.1"
          strokeWidth="1"
          strokeDasharray="5,5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, delay: 1 }}
        />
        <motion.line
          x1="25%" y1="35%" x2="45%" y2="25%"
          stroke="hsl(173, 80%, 36%)"
          strokeOpacity="0.1"
          strokeWidth="1"
          strokeDasharray="5,5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, delay: 1.5 }}
        />
        <motion.line
          x1="45%" y1="25%" x2="65%" y2="40%"
          stroke="hsl(173, 80%, 36%)"
          strokeOpacity="0.1"
          strokeWidth="1"
          strokeDasharray="5,5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, delay: 2 }}
        />
      </svg>

      {/* Floating gradient orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(173, 80%, 36%, 0.08) 0%, transparent 70%)',
        }}
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(190, 70%, 40%, 0.1) 0%, transparent 70%)',
        }}
        animate={{
          x: [0, -40, 0],
          y: [0, -20, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    if (result.success) {
      router.push('/');
    } else {
      setError(result.error || 'Login failed');
    }
    setLoading(false);
  };

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <AnimatedBackground />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo and branding */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="w-20 h-20 mx-auto rounded-2xl overflow-hidden shadow-lg mb-4 border-2 border-white/50"
            whileHover={{ scale: 1.05, rotate: 2 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Image
              src={tillerLogo}
              alt="Tiller Logo"
              width={80}
              height={80}
              className="object-cover w-full h-full"
            />
          </motion.div>
          <motion.h1
            className="text-3xl font-bold text-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Tiller
          </motion.h1>
          <motion.p
            className="text-muted-foreground mt-1 flex items-center justify-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <TrendingUp className="w-4 h-4 text-primary" />
            <span>Project & Billing Tracker</span>
          </motion.p>
        </motion.div>

        {/* Login card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="backdrop-blur-xl bg-white/70 rounded-2xl p-8 shadow-2xl border border-white/50"
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.5) inset',
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-xl font-semibold text-foreground mb-2">Welcome back</h2>
            <p className="text-sm text-muted-foreground mb-6">Sign in to access your dashboard</p>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 text-sm"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 bg-white/50 border-gray-200 focus:border-primary focus:ring-primary/20 transition-all"
                  placeholder="you@company.com"
                  required
                />
              </div>
            </motion.div>

            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 bg-white/50 border-gray-200 focus:border-primary focus:ring-primary/20 transition-all"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Button
                type="submit"
                className="w-full h-11 text-base font-medium shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </motion.div>
          </form>

          {/* Footer */}
          <motion.div
            className="mt-6 pt-6 border-t border-gray-100 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <p className="text-xs text-muted-foreground">
              Secure access to Tiller Project Management System
            </p>
          </motion.div>
        </motion.div>

        {/* Bottom branding */}
        <motion.p
          className="text-center text-xs text-muted-foreground mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Tiller 
        </motion.p>
      </div>
    </div>
  );
}
