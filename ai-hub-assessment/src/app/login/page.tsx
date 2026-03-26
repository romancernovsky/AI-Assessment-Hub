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
  
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await signIn('credentials', {
      redirect: false,
      email: form.email,
      password: form.password,
    });

    if (res?.error) {
      setError('Invalid email or password');
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-12rem)] animate-fade-in-up">
      <div className="w-full max-w-md border border-border p-8 bg-card">
        <h1 className="text-3xl font-medium mb-6">Login</h1>
        {registered && <div className="mb-4 text-green-700 dark:text-green-400 text-center text-sm">Registration successful! Please login.</div>}
        {error && <div className="mb-4 text-red-600 dark:text-red-400 text-center text-sm">{error}</div>}
        
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
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account? <Link href="/register" className="text-[#ff4e00] hover:underline transition-colors">Register</Link>
        </div>
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
