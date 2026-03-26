import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="animate-fade-in-up -mx-6 -mt-24">
      {/* ── Hero Banner with Cosmos Gradient ── */}
      <section className="relative flex items-center overflow-hidden">
        {/* Gradient background image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/gradient-banner.png"
            alt=""
            fill
            className="object-cover"
            priority
          />
        </div>
        {/* Cosmos gradient overlay: dark left → transparent right */}
        <div className="absolute inset-0 z-[1]" style={{
          background: 'linear-gradient(90deg, rgba(22,22,22,0.92) 0%, rgba(22,22,22,0.85) 25%, rgba(22,22,22,0.50) 50%, rgba(22,22,22,0.10) 70%, transparent 85%)'
        }} />
        
        <div className="relative z-[2] max-w-[1400px] mx-auto px-6 w-full py-20">
          <div className="max-w-2xl space-y-6">
            <h1 className="text-5xl md:text-[64px] font-medium text-[#fcfcfc]" style={{ lineHeight: '1.0' }}>
              Measure Your AI Competency
            </h1>
            <p className="text-xl text-[#fcfcfc]/80 max-w-lg" style={{ lineHeight: '1.3' }}>
              A realistic assessment platform measuring judgment, applied skills, and hands-on ability with GenAI tools.
            </p>
            <div className="flex items-center gap-8 pt-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 text-[#fcfcfc] font-medium text-base border-b border-[#fcfcfc]/40 pb-1 hover:border-[#fcfcfc] transition-all duration-200"
              >
                Get Started
                <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-[#fcfcfc]/70 font-medium text-base hover:text-[#fcfcfc] transition-colors duration-200"
              >
                Sign In &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Cards Section ── */}
      <section className="max-w-[1400px] mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: "/icons/Data-analytics.svg",
              title: "Realistic Scenarios",
              desc: "Face true-to-life challenges mapping directly to daily AI usage."
            },
            {
              icon: "/icons/Globe.svg",
              title: "Four Dimensions",
              desc: "Evaluate AI Mindset, Applied Skills, Domain Integration, and Technical Proficiency."
            },
            {
              icon: "/icons/Data-chart.svg",
              title: "Performance Tracking",
              desc: "Immediate multi-axis feedback and targeted learning paths upon completion."
            }
          ].map((card) => (
            <div key={card.title} className="border border-border p-8 group hover:border-[#ff4e00]/30 transition-all duration-300">
              <div className="mb-6">
                <Image src={card.icon} alt="" width={48} height={48} className="dark:invert" />
              </div>
              <h3 className="text-xl font-medium mb-3 group-hover:text-[#ff4e00] transition-colors">{card.title}</h3>
              <p className="text-muted-foreground text-base leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Media Content Stripe — Methodology ── */}
      <section className="bg-[#f5f5f5] dark:bg-[#1a1a1a]">
        <div className="max-w-[1400px] mx-auto px-6 py-16">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-[32px] font-medium" style={{ lineHeight: '1.0' }}>
                Built on Applied AI Research
              </h2>
              <p className="text-muted-foreground text-base leading-relaxed">
                Grounded in Filip Drimalka&apos;s &ldquo;Superpowered Professional&rdquo; framework, the assessment 
                moves beyond tool-specific knowledge to measure transferable AI judgment that works 
                across any platform.
              </p>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-foreground font-medium text-base hover:text-[#ff4e00] transition-colors duration-200"
              >
                Learn more <span className="transition-transform duration-200">&rarr;</span>
              </Link>
            </div>
            <div className="flex justify-center gap-6">
              <div className="border border-border bg-card p-6 space-y-3 w-full max-w-[280px]">
                <Image src="/icons/Brain.svg" alt="" width={40} height={40} className="dark:invert" />
                <div className="text-[#ff4e00] text-2xl font-medium">90%</div>
                <p className="text-sm text-muted-foreground">AI competency is mindset — how you frame problems, verify outputs, and think critically.</p>
              </div>
              <div className="border border-border bg-card p-6 space-y-3 w-full max-w-[280px]">
                <Image src="/icons/Integration.svg" alt="" width={40} height={40} className="dark:invert" />
                <div className="text-[#ff4e00] text-2xl font-medium">4 Axes</div>
                <p className="text-sm text-muted-foreground">Measured across Mindset, Applied Skills, Domain Integration, and Technical Proficiency.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Gradient accent stripe (≤30% rule) ── */}
      <div className="h-1 w-full" style={{
        background: 'linear-gradient(90deg, #ff4e00 0%, #a5bff5 50%, #eda8d1 100%)'
      }} />

      {/* ── CTA Banner Section ── */}
      <section className="bg-[#161616]">
        <div className="max-w-[1400px] mx-auto px-6 py-20">
          <div className="max-w-2xl space-y-6">
            <h2 className="text-[32px] font-medium text-[#fcfcfc]" style={{ lineHeight: '1.0' }}>
              Ready to assess your AI skills?
            </h2>
            <p className="text-[#fcfcfc]/70 text-base leading-relaxed">
              30 scenario-based questions. Approximately 30 minutes. Immediate dimension-level feedback 
              with targeted learning recommendations.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 text-[#fcfcfc] font-medium text-base border-b border-[#fcfcfc]/40 pb-1 hover:border-[#fcfcfc] transition-all duration-200"
            >
              Start your assessment &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer-like section ── */}
      <section className="bg-[#161616] border-t border-white/8">
        <div className="max-w-[1400px] mx-auto px-6 py-8 flex items-center gap-3">
          <Image src="/brand-symbol-white.svg" alt="Novartis" width={16} height={16} className="opacity-50" />
          <p className="text-[#fcfcfc]/50 text-sm">
            &copy; {new Date().getFullYear()} Novartis AG &mdash; AIHub Assessment
          </p>
        </div>
      </section>
    </div>
  );
}
