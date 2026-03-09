import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (forgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success('Check your email for the password reset link.');
        setForgotPassword(false);
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Welcome back!');
        navigate('/');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success('Account created! Please check your email to verify your account.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 neural-bg">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-3 glow-primary">
            <Brain className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">NeuroInsight AI</h1>
          <p className="text-xs text-muted-foreground mt-1">Cognitive & Emotional Analysis Platform</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="text-sm font-semibold text-foreground mb-1">
            {forgotPassword ? 'Reset Password' : isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-xs text-muted-foreground mb-5">
            {forgotPassword ? 'Enter your email to receive a reset link.' : isLogin ? 'Sign in to access your dashboard.' : 'Sign up to start analyzing.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && !forgotPassword && (
              <div>
                <Label className="text-xs text-muted-foreground">Full Name</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Your name"
                    className="pl-9 bg-secondary"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-9 bg-secondary"
                  required
                />
              </div>
            </div>

            {!forgotPassword && (
              <div>
                <Label className="text-xs text-muted-foreground">Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9 pr-9 bg-secondary"
                    required
                    minLength={6}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                    {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </div>
              </div>
            )}

            {isLogin && !forgotPassword && (
              <button type="button" onClick={() => setForgotPassword(true)} className="text-[10px] text-primary hover:underline">
                Forgot password?
              </button>
            )}

            <Button type="submit" variant="neuro" className="w-full" disabled={loading}>
              {loading ? 'Processing...' : forgotPassword ? 'Send Reset Link' : isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            {forgotPassword ? (
              <button onClick={() => setForgotPassword(false)} className="text-xs text-primary hover:underline">
                Back to sign in
              </button>
            ) : (
              <button onClick={() => setIsLogin(!isLogin)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <span className="text-primary font-medium">{isLogin ? 'Sign Up' : 'Sign In'}</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
