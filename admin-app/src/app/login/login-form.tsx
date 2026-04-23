'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, Mail, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError('Invalid email or password.');
        return;
      }

      router.push('/admin');
      router.refresh();
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-violet-900/20 via-transparent to-transparent" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />

      {/* Card */}
      <div className="relative w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/25">
            <span className="text-white font-bold text-base tracking-tight">GG</span>
          </div>
          <h1 className="text-[22px] font-bold text-white tracking-[-0.02em]">Welcome back</h1>
          <p className="text-sm text-slate-400 mt-1">Sign in to Grocery-Go Admin</p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl p-8 premium-shadow-lg">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[13px] font-medium text-slate-300">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 text-[14px] bg-white/[0.06] border-white/[0.08] text-white placeholder:text-slate-500 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50 rounded-xl"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[13px] font-medium text-slate-300">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11 text-[14px] bg-white/[0.06] border-white/[0.08] text-white placeholder:text-slate-500 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50 rounded-xl"
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
                <p className="text-[13px] text-red-400">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-[14px] rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-[12px] text-slate-600 mt-6">
          Secure admin access &middot; Grocery-Go
        </p>
      </div>
    </div>
  );
}
