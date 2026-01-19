"use client";

import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import { Calendar, Building2, Briefcase } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils"; 

export default function Experience() {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);

  const experiences = [
    {
      company: "Freelance / Self-Employed",
      role: "Systems & Backend Engineer",
      period: "2024 - Present",
      description: "Architecting scalable backend solutions for various clients. Specializing in high-performance APIs using Rust and Go, and deploying cloud-native infrastructure on GCP.",
      tags: ["Rust", "Go", "GCP", "System Design"]
    },
    {
      company: "PT LAPI ITB",
      role: "Fullstack Engineer",
      period: "Oct 2023 - Jan 2026",
      description: "Led the development of a comprehensive Learning Management System (LMS). Optimized database queries for high-concurrency access and implemented secure file handling using MinIO/S3 protocols.",
      tags: ["Laravel", "PostgreSQL", "Docker", "Redis"]
    },
    {
      company: "Vessel Tracking Project",
      role: "IoT Backend Engineer",
      period: "2025",
      description: "Engineered a real-time telemetry processing system processing 5000+ messages/second. Reduced data latency by implementing MQTT over WebSockets.",
      tags: ["Rust", "MQTT", "TimescaleDB"]
    },
    {
      company: "Gemini AI Integration",
      role: "AI API Developer",
      period: "Late 2025",
      description: "Built a Go-based middleware to interact with Google's Gemini AI, managing token limits and context caching for a chat application.",
      tags: ["Golang", "Fiber", "Generative AI"]
    }
  ];

  React.useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const plugin = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );

  return (
    <section id="experience" className="scroll-mt-32 py-24 bg-slate-950/50">
      
      {/* Header */}
      <div className="px-6 md:px-12 lg:px-24 max-w-7xl mx-auto mb-10 flex flex-col items-center text-center">
        <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <Briefcase size={24} />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Professional Journey</h2>
        <p className="text-slate-400 mt-2 max-w-lg">
          My timeline of delivering high-impact software solutions.
        </p>
      </div>

      {/* CAROUSEL CONTAINER */}
      <div className="relative w-full max-w-[1400px] mx-auto px-4 md:px-0">
        <Carousel
          setApi={setApi}
          plugins={[plugin.current]}
          opts={{
            align: "center",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4 py-8"> 
            
            {experiences.map((exp, index) => {
              const isActive = index === current;

              return (
                <CarouselItem 
                  key={index} 
                  className="pl-4 basis-[85%] md:basis-[65%] lg:basis-[50%]"
                >
                  <div 
                    className={cn(
                      "h-full transition-all duration-500 ease-out", 
                      isActive 
                        ? "opacity-100 scale-100 blur-0 z-10" 
                        : "opacity-40 scale-90 blur-[2px] grayscale-[50%]" 
                    )}
                  >
                    <Card className={cn(
                      "h-full border-slate-800 bg-slate-900/80 backdrop-blur-sm transition-colors",
                      isActive ? "border-emerald-500/50 shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)]" : "hover:border-slate-700"
                    )}>
                      <CardContent className="flex flex-col p-6 md:p-8 h-full justify-between">
                        
                        <div>
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded bg-slate-950 flex items-center justify-center text-slate-400 border border-slate-800">
                                <Building2 size={20} />
                              </div>
                              <div className="text-left">
                                <div className="text-emerald-400 font-bold text-sm md:text-base">{exp.company}</div>
                                <div className="text-slate-500 text-xs font-mono">{exp.period}</div>
                              </div>
                            </div>
                          </div>

                          <h3 className="text-2xl md:text-3xl font-bold text-slate-100 mb-4">{exp.role}</h3>
                          
                          <p className="text-slate-400 text-sm md:text-base leading-relaxed mb-6">
                            {exp.description}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-800/50">
                          {exp.tags.map((tag) => (
                            <span key={tag} className="text-xs font-mono text-slate-300 px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800">
                              #{tag}
                            </span>
                          ))}
                        </div>

                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          
          <CarouselPrevious className="hidden md:flex left-4 bg-black/50 border-white/10 text-white hover:bg-emerald-500 hover:text-white backdrop-blur-md h-12 w-12" />
          <CarouselNext className="hidden md:flex right-4 bg-black/50 border-white/10 text-white hover:bg-emerald-500 hover:text-white backdrop-blur-md h-12 w-12" />
        </Carousel>
      </div>
    </section>
  );
}