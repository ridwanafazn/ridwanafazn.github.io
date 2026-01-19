"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Github, Linkedin, Mail } from "lucide-react";

export default function Navbar() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    // CONTAINER UTAMA (Positioning)
    // - top-4: Memberi jarak dari atas (efek melayang)
    // - w-[92%]: Lebar tidak penuh di layar kecil
    // - rounded-2xl: Sudut membulat (Island shape)
    // - border-white/10: Garis batas halus agar kontras dengan bg gelap
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] md:w-full max-w-6xl rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-2xl transition-all duration-300">
      
      <div className="flex h-16 items-center justify-between px-4 md:px-8">
        
        {/* 1. Logo Brand */}
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="h-9 w-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shadow-inner group-hover:scale-105 transition-transform">
            🍉
          </div>
          <span className="font-semibold text-base md:text-lg tracking-tight font-mono text-slate-200 group-hover:text-white transition-colors">
            ridwanafazn
          </span>
        </div>

        {/* 2. Desktop Navigation (Links) */}
        {/* Menggunakan background pill tipis saat hover */}
        <div className="hidden md:flex items-center gap-1 bg-slate-950/50 p-1 rounded-full border border-white/5">
          <button 
            onClick={() => scrollToSection("about")} 
            className="text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 px-4 py-1.5 rounded-full transition-all"
          >
            Stack
          </button>
          <button 
            onClick={() => scrollToSection("experience")} 
            className="text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 px-4 py-1.5 rounded-full transition-all"
          >
            Experience
          </button>
          <button 
            onClick={() => scrollToSection("projects")} 
            className="text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 px-4 py-1.5 rounded-full transition-all"
          >
            Projects
          </button>
        </div>

        {/* 3. Social & Contact Actions */}
        <div className="flex items-center gap-2">
          {/* GitHub Icon */}
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-full hidden sm:inline-flex" asChild>
            <Link href="https://github.com/ridwanafazn" target="_blank" aria-label="GitHub Profile">
              <Github className="h-5 w-5" />
            </Link>
          </Button>

          {/* LinkedIn Icon */}
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-full hidden sm:inline-flex" asChild>
            <Link href="https://linkedin.com/in/ridwanafazn" target="_blank" aria-label="LinkedIn Profile">
              <Linkedin className="h-5 w-5" />
            </Link>
          </Button>

          {/* Contact Button (Primary CTA) */}
          <Button 
            size="sm" 
            className="bg-white text-slate-950 hover:bg-slate-200 font-semibold ml-1 rounded-full px-5"
            onClick={() => window.location.href = 'mailto:your.email@example.com'}
          >
            <Mail className="mr-2 h-4 w-4" />
            Contact
          </Button>
        </div>
      </div>
    </nav>
  );
}