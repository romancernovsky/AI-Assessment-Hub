"use client";

import { useState } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Badge } from "@/components/ui/Badge";
import { Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function UserDetailClient({ user, attempts }: any) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDelete = async (attemptId: string) => {
    if (!confirm('Are you certain you want to permanently delete this assessment attempt?')) return;
    
    setIsDeleting(attemptId);
    try {
      const res = await fetch(`/api/admin/attempts/${attemptId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.refresh(); // Refresh Server Components Data
      } else {
        alert('Failed to delete attempt');
      }
    } catch (e) {
      alert('Error connecting to server');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/admin/users">
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to User List
        </button>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassPanel className="p-6 md:col-span-1 border-primary/20">
          <h2 className="text-xl font-bold mb-4 text-white">Profile</h2>
          <div className="space-y-4 text-sm text-gray-300">
            <div><span className="text-gray-500">Email:</span> {user.email}</div>
            <div><span className="text-gray-500">Role:</span> <Badge color="info">{user.role}</Badge></div>
            <div><span className="text-gray-500">Status:</span> {user.isActive ? <Badge color="success">Active</Badge> : <Badge color="warning">Inactive</Badge>}</div>
            <div><span className="text-gray-500">Registered:</span> {new Date(user.registeredAt).toLocaleDateString()}</div>
          </div>
        </GlassPanel>

        <GlassPanel className="p-6 md:col-span-2">
          <h2 className="text-xl font-bold mb-4 text-white">Assessment History</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-gray-400">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Score</th>
                  <th className="pb-3 font-medium">Version</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {attempts.map((attempt: any) => (
                  <tr key={attempt.attemptId} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 text-gray-300">{new Date(attempt.startTime).toLocaleString()}</td>
                    <td className="py-4">
                       {attempt.status === 'completed' ? <Badge color="success">Completed</Badge> : <Badge color="warning">In Progress</Badge>}
                    </td>
                    <td className="py-4">
                       {attempt.overallScore !== null ? `${attempt.overallScore.toFixed(1)}%` : '--'}
                    </td>
                    <td className="py-4">v{attempt.bankVersionId}</td>
                    <td className="py-4 text-right">
                       <button
                         onClick={() => handleDelete(attempt.attemptId)}
                         disabled={isDeleting === attempt.attemptId}
                         className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-50"
                         title="Delete Attempt"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </td>
                  </tr>
                ))}
                {attempts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500 italic">No attempts found for this user.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
