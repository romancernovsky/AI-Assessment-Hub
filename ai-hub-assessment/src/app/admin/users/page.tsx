'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { X } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [changingRole, setChangingRole] = useState<string | null>(null);
  
  // Create user form state
  const [createForm, setCreateForm] = useState({ email: '', displayName: '', password: '', role: 'contentAdmin' });
  const [creatingUser, setCreatingUser] = useState(false);
  const [createMessage, setCreateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Role change state
  const [selectedRole, setSelectedRole] = useState<string>('');

  useEffect(() => {
    fetchUsers(filter);
  }, [filter]);

  const fetchUsers = async (role: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?role=${role}`);
      const data = await res.json();
      if (res.ok) setUsers(data.users);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    if (!createForm.email || !createForm.displayName || !createForm.password) {
      setCreateMessage({ type: 'error', text: 'All fields are required' });
      return;
    }

    setCreatingUser(true);
    setCreateMessage(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm)
      });
      const data = await res.json();
      if (res.ok) {
        setCreateMessage({ type: 'success', text: 'User created successfully' });
        setCreateForm({ email: '', displayName: '', password: '', role: 'contentAdmin' });
        setTimeout(() => {
          setShowCreateModal(false);
          fetchUsers(filter);
        }, 1500);
      } else {
        setCreateMessage({ type: 'error', text: data.message || 'Failed to create user' });
      }
    } catch (error) {
      setCreateMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setCreatingUser(false);
    }
  };

  const changeUserRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole })
      });
      if (res.ok) {
        setChangingRole(null);
        fetchUsers(filter);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isActive: currentStatus !== 'Active' })
      });
      fetchUsers(filter);
    } catch(e) {
      console.error(e);
    }
  };

  const clearResult = async (userName: string, latestAttemptId: string) => {
    if (!latestAttemptId) return;
    if (!window.confirm(`Delete the latest assessment result for "${userName}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/attempts/${latestAttemptId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchUsers(filter);
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete result');
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred while deleting the result');
    }
  };

  const deleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Permanently delete user "${userName}"? All their assessment history will be removed.`)) return;
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchUsers(filter);
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete user');
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred while deleting the user');
    }
  };

  return (
    <div className="animate-fade-in-up pb-12">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1">
            {loading ? '…' : `${users.length} user${users.length !== 1 ? 's' : ''}`}
            {filter !== 'all' && ` · filtered by ${filter}`}
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-card border border-border px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-colors cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="contentAdmin">Content Admin</option>
          </select>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="text-white whitespace-nowrap"
          >
            + Create User
          </Button>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 space-y-4 border border-border bg-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-medium text-foreground">Create New User</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateForm({ email: '', displayName: '', password: '', role: 'contentAdmin' });
                  setCreateMessage(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Email</label>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="bg-muted border border-border text-foreground placeholder-muted-foreground"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Display Name</label>
                <Input
                  type="text"
                  placeholder="John Doe"
                  value={createForm.displayName}
                  onChange={(e) => setCreateForm({ ...createForm, displayName: e.target.value })}
                  className="bg-muted border border-border text-foreground placeholder-muted-foreground"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="bg-muted border border-border text-foreground placeholder-muted-foreground"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Role</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="w-full bg-muted border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
                >
                  <option value="contentAdmin">Content Admin</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            {createMessage && (
              <div className={`p-3 text-sm ${
                createMessage.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                  : 'bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/30'
              }`}>
                {createMessage.text}
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                onClick={createUser}
                disabled={creatingUser}
                className="flex-1 text-white"
              >
                {creatingUser ? 'Creating...' : 'Create User'}
              </Button>
              <Button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateForm({ email: '', displayName: '', password: '', role: 'contentAdmin' });
                  setCreateMessage(null);
                }}
                className="flex-1 bg-muted hover:bg-border text-muted-foreground"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="p-0 overflow-hidden border border-border bg-card">
        {loading ? (
          <div className="p-8 space-y-3 animate-pulse">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-14 bg-muted" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground min-w-[160px]">Name</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground min-w-[220px]">Email</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground min-w-[130px]">Role</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground min-w-[100px]">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground min-w-[120px]">Latest Score</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right min-w-[240px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-muted transition-colors duration-150 group">
                    {/* Name */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#ff4e00]/20 border border-[#ff4e00]/25 flex items-center justify-center text-xs font-medium text-primary shrink-0">
                          {user.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="font-medium text-foreground whitespace-nowrap">{user.name}</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-5">
                      <span className="text-muted-foreground text-sm">{user.email}</span>
                    </td>

                    {/* Role - with dropdown */}
                    <td className="px-6 py-5">
                      {changingRole === user.id ? (
                        <select
                          value={selectedRole}
                          onChange={(e) => changeUserRole(user.id, e.target.value)}
                          onBlur={() => setChangingRole(null)}
                          autoFocus
                          className="bg-muted border border-border rounded text-xs text-foreground focus:outline-none focus:border-primary/50 py-1 px-2"
                        >
                          <option value="contentAdmin">Content Admin</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <button
                          onClick={() => {
                            setChangingRole(user.id);
                            setSelectedRole(user.role);
                          }}
                          className="hover:opacity-80 transition-opacity"
                        >
                          <Badge color={user.role === 'admin' ? 'primary' : 'secondary'} className="text-xs whitespace-nowrap cursor-pointer">
                            {user.role === 'contentAdmin' ? 'Content Admin' : user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </Badge>
                        </button>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                        user.status === 'Active' ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          user.status === 'Active' ? 'bg-emerald-400' : 'bg-red-400'
                        }`} />
                        {user.status}
                      </span>
                    </td>

                    {/* Latest Score */}
                    <td className="px-6 py-5">
                      {user.latestScore !== 'N/A' ? (
                        <div className="flex items-center gap-2">
                          <span className="text-foreground font-semibold">{user.latestScore}%</span>
                          <div className="flex-1 h-1.5 bg-border overflow-hidden w-16">
                            <div
                              className="h-full"
                              style={{
                                width: `${user.latestScore}%`,
                                backgroundColor: user.latestScore >= 80 ? '#34d399' : '#f59e0b'
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm italic">Not taken</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleUserStatus(user.id, user.status)}
                          className="text-xs px-3 py-1.5 bg-muted border border-border hover:bg-border transition-all duration-150 text-muted-foreground hover:text-foreground whitespace-nowrap"
                        >
                          {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                        {user.latestAttemptId && (
                          <button
                            onClick={() => clearResult(user.name, user.latestAttemptId)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/8 text-amber-400 border border-amber-500/20 hover:bg-amber-500/15 hover:border-amber-500/35 transition-all duration-150 whitespace-nowrap"
                          >
                            Clear Result
                          </button>
                        )}
                        <button
                          onClick={() => deleteUser(user.id, user.name)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-red-500/8 text-red-400 border border-red-500/20 hover:bg-red-500/15 hover:border-red-500/35 transition-all duration-150"
                        >
                          Delete
                        </button>
                        <Link href={`/admin/users/${user.id}`}>
                          <button className="text-xs px-3 py-1.5 rounded-lg bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 hover:border-primary/50 transition-all duration-150">
                            View
                          </button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 bg-muted border border-border flex items-center justify-center">
                          <svg className="w-5 h-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                          </svg>
                        </div>
                        <p className="text-muted-foreground text-sm">No users found for this filter.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

