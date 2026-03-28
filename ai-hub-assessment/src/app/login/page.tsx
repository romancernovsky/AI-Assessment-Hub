'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get('registered');
  const error = searchParams.get('error');
  
  const [form, setForm] = useState({ email: '', password: '' });
  const [credError, setCredError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  const handleSSO = () => {
    setSsoLoading(true);
    signIn('azure-ad', { callbackUrl: '/dashboard' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCredError('');

    const res = await signIn('credentials', {
      redirect: false,
      email: form.email,
      password: form.password,
    });

    if (res?.error) {
      setCredError('Invalid email or password');
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-12rem)] animate-fade-in-up">
      <div className="w-full max-w-md border border-border p-8 bg-card">
        <h1 className="text-3xl font-medium mb-6">Sign In</h1>
        {registered && <div className="mb-4 text-[#ff4e00] text-center text-sm">Registration successful! Please login.</div>}
        {error && <div className="mb-4 text-destructive text-center text-sm">Authentication failed. Please try again.</div>}

        {/* SSO Login — Novartis brand style */}
        <div className="flex flex-col gap-4 mb-6">
          <button
            type="button"
            onClick={handleSSO}
            disabled={ssoLoading}
            className="group w-full border-b-2 border-[#161616] dark:border-[#fcfcfc] py-4 px-0 bg-transparent text-[#161616] dark:text-[#fcfcfc] font-medium text-base transition-all duration-300 hover:border-[#ff4e00] hover:text-[#ff4e00] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
          >
            <span className="inline-flex items-center gap-3">
              <svg width="20" height="20" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
              </svg>
              {ssoLoading ? 'Redirecting to Novartis...' : 'Sign in with Novartis SSO'}
            </span>
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Admin Login</span>
          </div>
        </div>

        {/* Toggle admin credentials form */}
        {!showAdminLogin ? (
          <button
            type="button"
            onClick={() => setShowAdminLogin(true)}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign in with admin credentials →
          </button>
        ) : (
          <>
            {credError && <div className="mb-4 text-destructive text-center text-sm">{credError}</div>}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Email</label>
                <Input 
                  type="email" 
                  required 
                  className="w-full"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Password</label>
                <Input 
                  type="password" 
                  required 
                  className="w-full"
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                />
              </div>
              <Button type="submit" className="mt-4" disabled={loading}>
                {loading ? 'Logging in...' : 'Sign In'}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Don&apos;t have an account? <Link href="/register" className="text-[#ff4e00] hover:underline transition-colors">Register</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[calc(100vh-12rem)]">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
