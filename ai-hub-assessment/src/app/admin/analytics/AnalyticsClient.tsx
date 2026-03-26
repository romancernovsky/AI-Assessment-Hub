"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Download, ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react";

export default function AnalyticsClient() {
  const [data, setData] = useState<{ 
    heatmap: any[]; 
    reactionSummary: any[];
    detailedReactions: any[];
    topCompetencies: any[];
    bottomCompetencies: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  const downloadResultsCSV = () => window.location.href = '/api/admin/export/results';
  const downloadReactionsCSV = () => window.location.href = '/api/admin/export/reactions';

  if (loading) return <div className="text-center py-20 animate-pulse text-muted-foreground">Loading Analytics...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* CSV Export Actions */}
      <div className="p-6 border border-border bg-card">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-medium text-foreground mb-2">Data Exports</h2>
            <p className="text-muted-foreground text-sm">Download full assessment results and raw question reactions for offline analysis.</p>
          </div>
          <div className="flex gap-4">
            <Button onClick={downloadResultsCSV} className="flex gap-2 items-center">
              <Download className="w-4 h-4" /> Results CSV
            </Button>
            <Button onClick={downloadReactionsCSV} className="flex gap-2 items-center">
               <Download className="w-4 h-4" /> Reactions CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Dimension Heatmap */}
        <div className="p-6 lg:col-span-1 h-fit border border-border bg-card">
          <h2 className="text-lg font-medium text-foreground mb-6">Dimension Heatmap</h2>
          <div className="space-y-5">
            {data?.heatmap?.map((item: any) => (
              <div key={item.dimension}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-foreground font-medium text-sm">{item.dimension}</span>
                  <span className="text-primary font-semibold tabular-nums text-sm">{item.average}%</span>
                </div>
                <div className="w-full bg-border h-2.5">
                  <div 
                    className="bg-[#ff4e00] h-2.5 transition-all duration-1000"
                    style={{ width: `${item.average}%` }}
                  />
                </div>
              </div>
            ))}
            {(!data?.heatmap || data.heatmap.length === 0) && (
              <div className="text-center text-muted-foreground py-8 italic text-sm">No dimension data available yet.</div>
            )}
          </div>
        </div>

        {/* Competency Strengths/Opportunities */}
        <div className="grid grid-cols-1 gap-8 lg:col-span-2">
          <div className="p-6 border border-border bg-card">
            <h2 className="text-xl font-medium text-foreground mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#ff4e00]"></span> Top 5 Strengths
            </h2>
            <div className="space-y-3">
              {data?.topCompetencies?.map((comp: any) => (
                <div key={comp.code} className="flex justify-between items-center px-4 py-3.5 bg-muted/50 border border-border hover:bg-muted transition-colors">
                  <div className="min-w-0 pr-4">
                    <div className="text-xs font-medium text-[#ff4e00] uppercase tracking-wider mb-0.5">{comp.code}</div>
                    <div className="text-sm font-medium text-foreground truncate">{comp.name}</div>
                  </div>
                  <div className="text-xl font-medium text-[#ff4e00] shrink-0">{comp.average}%</div>
                </div>
              ))}
              {(!data?.topCompetencies || data.topCompetencies.length === 0) && (
                <div className="text-center text-muted-foreground py-4 italic text-sm">No competency data available.</div>
              )}
            </div>
          </div>

          <div className="p-6 border border-border bg-card">
            <h2 className="text-xl font-medium text-foreground mb-6 flex items-center gap-2">
               <span className="w-2 h-2 bg-muted-foreground"></span> Top 5 Opportunities
            </h2>
            <div className="space-y-3">
              {data?.bottomCompetencies?.map((comp: any) => (
                <div key={comp.code} className="flex justify-between items-center px-4 py-3.5 bg-muted/50 border border-border hover:bg-muted transition-colors">
                  <div className="min-w-0 pr-4">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">{comp.code}</div>
                    <div className="text-sm font-medium text-foreground truncate">{comp.name}</div>
                  </div>
                  <div className="text-xl font-medium text-foreground shrink-0">{comp.average}%</div>
                </div>
              ))}
               {(!data?.bottomCompetencies || data.bottomCompetencies.length === 0) && (
                <div className="text-center text-muted-foreground py-4 italic text-sm">No competency data available.</div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Detailed Reaction Tracker */}
      <div className="grid grid-cols-1 gap-8">
        <div className="p-0 overflow-hidden shadow-2xl border border-border bg-card">
          <div className="p-6 border-b border-border bg-muted flex justify-between items-center">
            <div>
              <h2 className="text-xl font-medium text-foreground tracking-tight">Question Feedback Tracker</h2>
              <p className="text-sm text-muted-foreground mt-1">Real-time user feedback, reactions, and comments on assessment questions for continuous improvement.</p>
            </div>
            <div className="px-3 py-1 bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-widest">
              Live Feed
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">User</th>
                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">Question Details</th>
                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">Competency</th>
                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">Reaction</th>
                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">Comment Flag</th>
                  <th className="px-6 py-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">Date Reported</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data?.detailedReactions?.map((r: any) => (
                  <tr key={r.id} className="hover:bg-muted transition-colors duration-200 group">
                    {/* User */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#ff4e00]/10 border border-[#ff4e00]/20 flex items-center justify-center text-xs font-medium text-primary shrink-0 group-hover:scale-105 transition-transform">
                          {r.userName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors whitespace-nowrap">{r.userName}</span>
                      </div>
                    </td>

                    {/* Question Info */}
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5">
                        <span className="px-2 py-0.5 w-fit text-[10px] font-medium bg-muted text-muted-foreground border border-border uppercase tracking-tighter">
                          Level {r.level}
                        </span>
                        <span className="text-[10px] font-mono font-medium text-muted-foreground tracking-tighter">ID: {r.questionId}</span>
                      </div>
                    </td>

                    {/* Competency */}
                    <td className="px-6 py-5">
                      <div className="max-w-[180px]">
                        <span className="text-sm font-medium text-foreground leading-snug">{r.competencyName}</span>
                      </div>
                    </td>

                    {/* Reaction */}
                    <td className="px-6 py-5">
                      {r.vote === 'up' ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#ff4e00]/10 text-[#ff4e00] font-bold text-[11px] w-fit border border-[#ff4e00]/20">
                          <ThumbsUp className="w-3.5 h-3.5" /> LIKE
                        </div>
                      ) : r.vote === 'down' ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted text-muted-foreground font-bold text-[11px] w-fit border border-border">
                          <ThumbsDown className="w-3.5 h-3.5" /> DISLIKE
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs italic tracking-wide">No vote</span>
                      )}
                    </td>

                    {/* Comment */}
                    <td className="px-6 py-5">
                      {r.comment ? (
                        <div className="flex items-start gap-2.5 text-muted-foreground text-sm group-hover:text-foreground transition-colors max-w-sm">
                          <MessageSquare className="w-4 h-4 mt-0.5 shrink-0 text-primary/60" />
                          <p className="italic leading-relaxed line-clamp-2 font-medium">"{r.comment}"</p>
                        </div>
                      ) : (
                        <div className="text-muted-foreground/50 text-[11px] font-medium tracking-tight bg-muted px-3 py-1.5 w-fit border border-border">
                          No qualitative data
                        </div>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-muted-foreground tabular-nums">
                          {new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-widest mt-0.5">
                          {new Date(r.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {(!data?.detailedReactions || data.detailedReactions.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-700">
                        <div className="w-16 h-16 bg-muted border border-border flex items-center justify-center shadow-inner">
                          <MessageSquare className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground font-medium tracking-tight">No reactions detected</p>
                          <p className="text-muted-foreground/50 text-xs">When users provide feedback, it will appear here in real-time.</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
