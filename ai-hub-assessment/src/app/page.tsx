import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center animate-fade-in-up">
      <div className="max-w-3xl space-y-8">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
          Measure Your <span className="text-gradient">AI Competency</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          A realistic assessment platform measuring judgment, applied skills, and hands-on ability with GenAI tools.
        </p>

        <div className="flex items-center justify-center gap-6 pt-8">
          <Link href="/register">
            <Button size="lg" className="w-48">
              Get Started
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="ghost" className="w-48">
              Sign In
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-20 text-left">
          <div className="glass-panel p-6 rounded-2xl">
            <div className="text-primary mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Realistic Scenarios</h3>
            <p className="text-muted-foreground text-sm">Face true-to-life challenges mapping directly to daily AI usage.</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl">
            <div className="text-primary mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Four Dimensions</h3>
            <p className="text-muted-foreground text-sm">Evaluate Fact-Checking, Prompt Engineering, Security, and Tool Identification.</p>
          </div>
          <div className="glass-panel p-6 rounded-2xl">
            <div className="text-primary mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Performance Tracking</h3>
            <p className="text-muted-foreground text-sm">Immediate multi-axis feedback and targeted learning paths upon completion.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
