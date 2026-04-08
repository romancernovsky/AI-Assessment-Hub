'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  role: string;
  externalId: string | null;
  isActive: boolean;
  registeredAt: string;
  lastLoginAt: string | null;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status, router]);

  async function fetchProfile() {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setEditName(data.displayName);
        setEditEmail(data.email);
      }
    } catch (e) {
      // Failed to load — loading state handles UI
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName: editName, email: editEmail }),
      });
      const data = await res.json();

      if (res.ok) {
        setProfile(data.user);
        setEditing(false);
        if (data.requireReauth) {
          setMessage({ type: 'success', text: 'Email updated. Signing you out so changes take effect...' });
          setTimeout(() => signOut({ callbackUrl: '/login' }), 2000);
        } else {
          setMessage({ type: 'success', text: 'Profile updated successfully.' });
        }
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update profile' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (profile) {
      setEditName(profile.displayName);
      setEditEmail(profile.email);
    }
    setEditing(false);
    setMessage(null);
  }

  const roleLabels: Record<string, { label: string; color: 'success' | 'warning' | 'info' }> = {
    admin: { label: 'Administrator', color: 'warning' },
    contentAdmin: { label: 'Content Admin', color: 'info' },
  };

  if (status === 'loading' || loading) {
    return <div className="animate-pulse py-20 text-center text-muted-foreground">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="text-center py-20 text-muted-foreground">Unable to load profile.</div>;
  }

  const roleInfo = roleLabels[profile.role] || { label: profile.role, color: 'info' as const };
  const registeredDate = new Date(profile.registeredAt).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
  const lastLoginDate = profile.lastLoginAt
    ? new Date(profile.lastLoginAt).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    : 'Never';

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <Button variant="ghost" onClick={() => router.push('/dashboard')} className="text-sm">
          ← Back to Dashboard
        </Button>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`mb-6 p-4 border text-sm ${
          message.type === 'success'
            ? 'bg-muted/50 border-border border-l-2 border-l-[#ff4e00] text-foreground'
            : 'bg-muted/50 border-border border-l-2 border-l-destructive text-foreground'
        }`}>
          {message.text}
        </div>
      )}

      <div className="p-8 border border-border bg-card">
        {/* Avatar & Name Header */}
        <div className="flex items-center gap-5 mb-8 pb-6 border-b border-border">
          <div className="w-16 h-16 bg-[#ff4e00] flex items-center justify-center text-2xl font-medium text-white shrink-0">
            {profile.displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-medium text-foreground">{profile.displayName}</h2>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant={roleInfo.color}>{roleInfo.label}</Badge>
              {profile.isActive ? (
                <span className="text-xs text-[#ff4e00]">● Active</span>
              ) : (
                <span className="text-xs text-muted-foreground">● Inactive</span>
              )}
            </div>
          </div>
          {!editing && (
            <Button variant="ghost" onClick={() => setEditing(true)} className="text-sm shrink-0">
              Edit Profile
            </Button>
          )}
        </div>

        {editing ? (
          /* Edit Mode */
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">Display Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="glass-input w-full"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-muted-foreground mb-2">Email Address</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="glass-input w-full"
                placeholder="your@email.com"
              />
            </div>

            <div className="pt-2">
              <label className="block text-sm font-semibold text-muted-foreground mb-2">Role</label>
              <div className="glass-input w-full opacity-60 cursor-not-allowed">
                {roleInfo.label}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Role can only be changed by an administrator.</p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} disabled={saving || !editName.trim() || !editEmail.trim()}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="ghost" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          /* View Mode */
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</label>
                <p className="text-foreground mt-1">{profile.email}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</label>
                <p className="text-foreground mt-1">{roleInfo.label}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Registered</label>
                <p className="text-foreground mt-1">{registeredDate}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Login</label>
                <p className="text-foreground mt-1">{lastLoginDate}</p>
              </div>
              {profile.externalId && (
                <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">External ID</label>
                <p className="text-foreground mt-1 font-mono text-sm">{profile.externalId}</p>
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">User ID</label>
                <p className="text-muted-foreground mt-1 font-mono text-sm">{profile.userId}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
