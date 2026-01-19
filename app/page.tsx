import { Button } from "@/components/ui/button";
import { ArrowRight, Terminal, Server, Database } from "lucide-react";
import TechStack from "@/components/TechStack";
import Experience from "@/components/Experience";
import Projects from "@/components/Projects";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col px-0 relative bg-slate-950">
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Tambahan id="home" di sini untuk target scroll FloatingNav */}
      <section id="home" className="min-h-screen flex flex-col justify-center px-6 md:px-12 lg:px-24 max-w-7xl mx-auto z-10 w-full">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700 text-sm text-slate-300 font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Open to Work / Freelance
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
              Architecting <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">Scalable Systems</span> & Intelligent Solutions.
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed">
              Hi, I'm <span className="text-white font-semibold">Ridwan Fauzan</span>.
              A Systems Engineer specializing in high-performance Backend (Go/Rust),
              Cloud Infrastructure (GCP), and Applied AI.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 font-mono text-sm text-slate-400">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/50 border border-slate-800 rounded-md">
              <Terminal size={14} className="text-blue-400" />
              <span>Backend/Systems</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/50 border border-slate-800 rounded-md">
              <Server size={14} className="text-teal-400" />
              <span>Cloud Native</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/50 border border-slate-800 rounded-md">
              <Database size={14} className="text-purple-400" />
              <span>Data Engineering</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button size="lg" className="bg-white text-slate-950 hover:bg-slate-200 font-semibold text-base h-12 px-8">
              View Selected Work
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white font-mono h-12 px-8">
              Start a Collab
            </Button>
          </div>
        </div>
      </section>

      <TechStack />
      <Experience />
      <Projects />
    </main>
  );
}