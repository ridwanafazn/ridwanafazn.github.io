"use client";

import { ExternalLink, Github, Code2, Cpu, LayoutTemplate, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import Link from "next/link";

export default function Projects() {
  // ... (Data projects sama persis) ...
  const projects = [
    {
      title: "Vessel Tracking System",
      category: "IoT & High-Performance Backend",
      // description: "A real-time telemetry processing engine handling 5k+ messages/sec. Built with Rust for zero-cost abstractions and MQTT over WebSockets for low-latency data delivery.",
      tech: ["Rust", "Actix", "TimescaleDB", "MQTT"],
      icon: <Cpu className="text-orange-400" size={40} />,
      link: "#", 
    },
    {
      title: "Enterprise LMS Core",
      category: "System Architecture",
      // description: "Refactored a monolithic legacy LMS into a modular microservices architecture. Improved concurrency handling by 40% and implemented a secure MinIO file storage cluster.",
      tech: ["Golang", "Docker", "PostgreSQL", "Redis"],
      icon: <LayoutTemplate className="text-blue-400" size={40} />,
      link: "#",
    },
    {
      title: "Gemini AI Middleware",
      category: "AI Integration & Security",
      // description: "A secure middleware service to interact with Google's Gemini API. Features token usage optimization, context caching, and a rate-limiting circuit breaker.",
      tech: ["Go", "Fiber", "Google AI SDK"],
      icon: <Code2 className="text-purple-400" size={40} />,
      link: "#",
    }
  ];

  return (
    // UBAH DI SINI: pt-12 pb-24
    <section id="projects" className="pt-12 pb-24 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto">
      
      {/* <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
           <h2 className="text-3xl font-bold text-white mb-2">Featured Deployments</h2>
           <p className="text-slate-400 max-w-xl">Selected case studies demonstrating scalable architecture and complex problem solving.</p>
        </div>
        <Button variant="outline" className="border-slate-800 bg-slate-900/50 text-slate-300 hover:bg-slate-800 hover:text-white hidden md:flex">
          <Github className="mr-2 h-4 w-4" /> View Full Archive
        </Button>
      </div> */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project, index) => (
          <Card key={index} className="bg-slate-900/20 border-slate-800 flex flex-col overflow-hidden group hover:border-slate-600 transition-all duration-300 hover:shadow-[0_0_30px_-10px_rgba(30,41,59,0.5)]">
            <div className="h-48 bg-slate-950 border-b border-slate-800 flex items-center justify-center relative overflow-hidden">
               <div className="absolute top-0 right-0 w-full h-full opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-700 via-slate-950 to-slate-950" />
               <div className="z-10 bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-2xl group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 ease-out">
                  {project.icon}
               </div>
            </div>

            <CardHeader className="pb-2 pt-6">
              <div className="text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider font-semibold">{project.category}</div>
              <h3 className="text-xl font-bold text-slate-100 group-hover:text-blue-400 transition-colors">{project.title}</h3>
            </CardHeader>

            <CardContent className="flex-1">
              <p className="text-slate-400 text-sm leading-relaxed mb-6">{project.description}</p>
              <div className="flex flex-wrap gap-2">
                {project.tech.map((t) => (
                  <span key={t} className="text-[10px] uppercase font-bold text-slate-500 bg-slate-950 px-2 py-1 rounded border border-slate-800">{t}</span>
                ))}
              </div>
            </CardContent>

            <CardFooter className="pt-4 border-t border-slate-800/50">
              <Link href={project.link} className="flex items-center text-sm font-medium text-slate-300 hover:text-white transition-colors group/link">
                View Architecture <ArrowRight className="ml-2 h-3 w-3 group-hover/link:translate-x-1 transition-transform" />
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <div className="mt-8 md:hidden">
        <Button variant="outline" className="w-full border-slate-800 bg-slate-900/50 text-slate-300 hover:bg-slate-800 hover:text-white"><Github className="mr-2 h-4 w-4" /> View Full Archive</Button>
      </div>
    </section>
  );
}