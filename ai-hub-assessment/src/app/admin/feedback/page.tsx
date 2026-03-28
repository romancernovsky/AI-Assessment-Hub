'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { MessageSquare, Star, Mail, User, Shield, Clock } from 'lucide-react';
import Link from 'next/link';

export default function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/feedback');
      const data = await res.json();
      if (res.ok) setFeedbacks(data);
    } catch (error) {
      // Fetch failed — loading state handles UI
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in-up pb-12 space-y-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Platform Feedback</h1>
          <p className="text-muted-foreground mt-1">
            {loading ? '…' : `${feedbacks.length} response${feedbacks.length !== 1 ? 's' : ''}`} collected from users.
          </p>
        </div>
        <Link href="/admin/analytics">
          <button className="bg-muted border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-border transition-colors">
            Back to Analytics
          </button>
        </Link>
      </div>

      <div className="p-0 overflow-hidden shadow-2xl border border-border bg-card">
        <div className="p-6 border-b border-border bg-muted flex justify-between items-center">
          <div>
            <h2 className="text-xl font-medium text-foreground tracking-tight">Feedback Inbox</h2>
            <p className="text-sm text-muted-foreground mt-1">Detailed list of user ratings and qualitative feedback.</p>
          </div>
          <div className="px-3 py-1 bg-[#ff4e00]/10 border border-[#ff4e00]/20 text-[10px] font-bold text-[#ff4e00] uppercase tracking-widest">
            Inbox
          </div>
        </div>
        
        {loading ? (
          <div className="text-center py-20 animate-pulse text-muted-foreground">Loading feedback...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">User Details</th>
                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">Account</th>
                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">Rating</th>
                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">Feedback</th>
                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {feedbacks.map((f) => (
                  <tr key={f.id} className="hover:bg-muted transition-colors duration-200 group">
                    {/* User */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#ff4e00]/10 border border-[#ff4e00]/20 flex items-center justify-center text-xs font-medium text-primary shrink-0 group-hover:scale-105 transition-transform">
                          <User className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{f.userName}</span>
                          <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                            <Mail className="w-2.5 h-2.5" /> {f.userEmail}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Account Info */}
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5">
                        <Badge color={f.userRole === 'admin' ? 'primary' : 'secondary'} className="text-[10px] py-0 px-2 w-fit">
                          {f.userRole.toUpperCase()}
                        </Badge>
                        <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                          <Shield className="w-2.5 h-2.5" /> {f.userRole === 'Guest' ? 'Public' : 'Auth User'}
                        </span>
                      </div>
                    </td>

                    {/* Rating */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-1 text-yellow-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3.5 h-3.5 ${i < (f.rating || 0) ? 'fill-current' : 'text-muted-foreground/20'}`} 
                          />
                        ))}
                      </div>
                    </td>

                    {/* Feedback Content */}
                    <td className="px-6 py-5">
                      <div className="flex items-start gap-2.5 text-muted-foreground text-sm group-hover:text-foreground transition-colors max-w-xl">
                        <MessageSquare className="w-4 h-4 mt-0.5 shrink-0 text-primary/60" />
                        <p className="leading-relaxed font-medium line-wrap">{f.content}</p>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-muted-foreground tabular-nums flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(f.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-widest mt-0.5 ml-4">
                          {new Date(f.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {feedbacks.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-700">
                        <div className="w-16 h-16 bg-muted border border-border flex items-center justify-center shadow-inner">
                          <MessageSquare className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground font-medium tracking-tight">No feedback yet</p>
                          <p className="text-muted-foreground/50 text-xs">When users share their thoughts, they will appear here.</p>
                        </div>
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
