import { Terminal, ArrowLeft, Shield, Cpu, Database, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function AboutSys() {
  return (
    <div className="min-h-screen bg-black text-zinc-300 font-mono flex flex-col items-center pt-16 px-6 pb-24">
      {/* HEADER */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-12">
        <Link href="/" className="flex items-center gap-2 text-xs font-bold uppercase text-zinc-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" /> [/back_to_core]
        </Link>
        <div className="flex items-center gap-2 text-xs uppercase text-zinc-500">
          <Terminal className="w-4 h-4" />
          <span>SYS_DOCS_V1.0</span>
        </div>
      </div>

      <div className="w-full max-w-4xl space-y-10">
        
        {/* MANIFESTO TITLE */}
        <div className="border-2 border-zinc-800 p-8 bg-black shadow-[8px_8px_0px_#27272a]">
          <h1 className="text-4xl font-extrabold text-white mb-4 uppercase tracking-tight">
            [SYS_MANIFESTO]
          </h1>
          <p className="text-zinc-400 text-base leading-relaxed mb-6">
            Scientific progress stalls when research data is buried inside static PDF supplements, hidden behind journal paywalls, or trapped in unformatted tables. 
          </p>
          <p className="text-zinc-400 text-base leading-relaxed">
            <strong className="text-white">SISYPHUS</strong> is an open-access repository built specifically for raw survey datasets in AI Safety, Cognitive Science, and Human-Model Interaction. Named after pushing open research uphill until it remains permanently accessible.
          </p>
        </div>

        {/* SYSTEM ARCHITECTURE / SPECS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-2 border-zinc-800 p-6 bg-black">
            <Database className="w-6 h-6 text-white mb-3" />
            <h2 className="text-lg font-bold text-white uppercase mb-2">01. Open Data Indexing</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Every uploaded dataset receives a standardized node ID (`SYS-xxx`), complete format tags, and raw download endpoints for rapid ingestion into computational pipelines.
            </p>
          </div>

          <div className="border-2 border-zinc-800 p-6 bg-black">
            <Cpu className="w-6 h-6 text-white mb-3" />
            <h2 className="text-lg font-bold text-white uppercase mb-2">02. Cognitive & AGI Focus</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Prioritizing datasets that evaluate human focus, cognitive fatigue, lucid state parameters, and human perception of artificial general intelligence.
            </p>
          </div>

          <div className="border-2 border-zinc-800 p-6 bg-black">
            <Shield className="w-6 h-6 text-white mb-3" />
            <h2 className="text-lg font-bold text-white uppercase mb-2">03. Anonymization Protocol</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              All public survey responses undergo zero-PII scrubbing to protect research participants while maintaining raw, high-fidelity quantitative value.
            </p>
          </div>

          <div className="border-2 border-zinc-800 p-6 bg-black">
            <BookOpen className="w-6 h-6 text-white mb-3" />
            <h2 className="text-lg font-bold text-white uppercase mb-2">04. Reusable Schemas</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Data is delivered in developer-friendly structured formats (`.CSV`, `.JSON`, `.XLSX`) so researchers can immediately query without cleaning headers.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}