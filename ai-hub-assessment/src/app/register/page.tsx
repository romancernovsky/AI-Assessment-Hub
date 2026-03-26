'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function Register() {
  const router = useRouter();
  const [form, setForm] = useState({ displayName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      router.push('/login?registered=true');
    } else {
      const data = await res.json();
      setError(data.message || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-12rem)] animate-fade-in-up">
      <div className="w-full max-w-md border border-border p-8 bg-card">
        <h1 className="text-3xl font-medium mb-6">Create Account</h1>
        {error && <div className="mb-4 text-red-600 dark:text-red-400 text-center text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">Display Name</label>
            <Input 
              type="text" 
              required 
              className="w-full"
              value={form.displayName}
              onChange={e => setForm({...form, displayName: e.target.value})}
            />
          </div>
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
            {loading ? 'Creating account...' : 'Register'}
          </Button>
        </form>
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account? <Link href="/login" className="text-[#ff4e00] hover:underline transition-colors">Login</Link>
        </div>
      </div>
    </div>
  );
}
