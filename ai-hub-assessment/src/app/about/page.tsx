import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-16 py-12 animate-fade-in-up">
      {/* Hero Section */}
      <section className="space-y-6">
        <h1 className="text-5xl md:text-6xl font-medium">
          About the <span className="text-[#ff4e00]">AI Competency</span> Assessment
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
          Measuring the transition from tool-specific knowledge to transferable AI judgment. 
          Aligned with the 2028 AI Lighthouse Goal.
        </p>
      </section>

      {/* Core Methodology */}
      <section className="grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h2 className="text-3xl font-medium">The Methodology</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Grounded in Filip Drimalka's <strong className="text-foreground">"Superpowered Professional"</strong> framework, 
              which holds that AI competency is 90% mindset and is built through concrete daily practice.
            </p>
            <p>
              This assessment moves beyond simple tool literacy. While v1 focused on M365 Copilot features, 
              <strong className="text-foreground"> Assessment v2</strong> shifts to measuring transferable AI judgment — 90% of questions 
              work regardless of which AI platform is used.
            </p>
          </div>
          <div className="flex gap-4">
            <Link href="/register">
              <Button>Start Assessment</Button>
            </Link>
          </div>
        </div>
        <div className="border border-border p-8 space-y-6 bg-nvs-grey2 dark:bg-[#1e1e1e]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#ff4e00]/10">
              <Image src="/icons/Lightbulb.svg" alt="" width={24} height={24} className="dark:invert" />
            </div>
            <h3 className="text-xl font-medium">90% Mindset Shift</h3>
          </div>
          <p className="text-muted-foreground">
            AI competency is not about which buttons you press, but how you frame problems, 
            verify outputs, and integrate AI as a thinking partner into your unique workflows.
          </p>
        </div>
      </section>

      {/* Four Dimensions */}
      <section className="space-y-10">
        <div className="space-y-4">
          <h2 className="text-3xl font-medium">The Four Dimensions</h2>
          <p className="text-muted-foreground">Your profile is measured across four weighted pillars of AI fluency.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { 
              name: 'AI Mindset', 
              weight: '35%', 
              icon: '/icons/Brain.svg', 
              desc: 'Critical thinking, verification reflexes, and growth mindset when AI fails.' 
            },
            { 
              name: 'Applied Skills', 
              weight: '30%', 
              icon: '/icons/Gears.svg', 
              desc: 'Effective prompting, providing context, and matching tools to specialized tasks.' 
            },
            { 
              name: 'Domain Integration', 
              weight: '25%', 
              icon: '/icons/Integration.svg', 
              desc: 'Connecting AI to your real business workflows and measuring actual impact.' 
            },
            { 
              name: 'Technical Proficiency', 
              weight: '10%', 
              icon: '/icons/Security.svg', 
              desc: 'Understanding of AI limits, security, and orchestrating multi-agent systems.' 
            }
          ].map((dim) => (
            <div key={dim.name} className="border border-border p-6 space-y-4 hover:border-[#ff4e00]/40 transition-all group">
              <div className="mb-2">
                <Image src={dim.icon} alt="" width={40} height={40} className="dark:invert" />
              </div>
              <div className="flex justify-between items-end">
                <h3 className="font-medium text-lg group-hover:text-[#ff4e00] transition-colors">{dim.name}</h3>
                <span className="text-xs font-mono text-[#ff4e00]/60">{dim.weight}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{dim.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Proficiency Bands */}
      <section className="border border-border p-8 md:p-12 overflow-hidden relative">
        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h2 className="text-3xl font-medium">Badges & Proficiency</h2>
            <p className="text-muted-foreground">
              The assessment results categorize you into one of two proficiency bands based on your overall weighted score.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="pt-1">
                  <Image src="/icons/Search.svg" alt="" width={24} height={24} className="dark:invert" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">AI Explorer (0-79%)</h4>
                  <p className="text-sm text-muted-foreground">You're on the path — keep building your AI judgment. You'll receive targeted recommendations for each dimension.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="pt-1">
                  <Image src="/icons/Trophy-award.svg" alt="" width={24} height={24} className="dark:invert" />
                </div>
                <div>
                  <h4 className="font-medium text-[#ff4e00] text-2xl">AI Enthusiast (80%+)</h4>
                  <p className="text-sm text-muted-foreground">Demonstrated strong AI competency. Recognized experts who can share knowledge and mentor others.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-8">
            <h3 className="text-xl font-medium flex items-center gap-2">
              <span className="w-8 h-px bg-[#ff4e00]/40" />
              Progressive Levels
            </h3>
            <div className="space-y-3">
              {[
                { l: 'L1', n: 'Foundational Literacy', d: 'Verification reflexes & mindset shifts.' },
                { l: 'L2', n: 'Advanced Productivity', d: 'AI as a thinking partner in workflows.' },
                { l: 'L3', n: 'AI Builder (Future)', d: 'Building solutions and secure code.' },
                { l: 'L4', n: 'AI Architect (Future)', d: 'Designing automated systems.' },
                { l: 'L5', n: 'AI Strategist (Future)', d: 'Multi-agent system governance.' },
              ].map((lvl) => (
                <div key={lvl.l} className="flex items-center gap-4 group cursor-default">
                  <span className="w-10 text-xs font-mono text-[#ff4e00]/60 group-hover:text-[#ff4e00] transition-colors">{lvl.l}</span>
                  <div>
                    <div className="font-medium text-foreground/90 group-hover:text-foreground transition-colors">{lvl.n}</div>
                    <div className="text-xs text-muted-foreground">{lvl.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 border-t border-border">
        <h2 className="text-3xl font-medium mb-6">Ready to Benchmark Your Skills?</h2>
        <p className="text-muted-foreground mb-8 max-w-2xl">
          The assessment takes approximately 30 minutes. You will receive immediate feedback 
          on each scenario and a personalized learning path upon completion.
        </p>
        <Link href="/assessment">
          <Button size="lg" className="px-12">
            Start Assessment Now
          </Button>
        </Link>
      </section>
    </div>
  );
}
