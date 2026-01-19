"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Home, Layers, Briefcase, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { id: "home", label: "Home", icon: Home, color: "text-cyan-400", bg: "bg-cyan-500/20" },
  { id: "about", label: "Stack", icon: Layers, color: "text-blue-400", bg: "bg-blue-500/20" },
  { id: "experience", label: "Journey", icon: Briefcase, color: "text-emerald-400", bg: "bg-emerald-500/20" },
  { id: "projects", label: "Work", icon: Rocket, color: "text-purple-400", bg: "bg-purple-500/20" },
];

export default function FloatingNav() {
  const [activeSection, setActiveSection] = useState("home");
  const [tempVisible, setTempVisible] = useState<string | null>(null); // State untuk efek "Flash"

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const newSection = entry.target.id;
            setActiveSection(newSection);
            setTempVisible(newSection);
            
            setTimeout(() => {
              setTempVisible((prev) => (prev === newSection ? null : prev));
            }, 600);
          }
        });
      },
      { threshold: 0.5 }
    );

    navItems.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="fixed left-6 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col gap-4">
      {navItems.map((item) => {
        const isActive = activeSection === item.id;
        // Label muncul jika: Mouse Hover (group-hover) ATAU sedang efek Flash (item.id === tempVisible)
        const isLabelVisible = tempVisible === item.id; 

        return (
          <div key={item.id} className="relative group flex items-center">
            
            {/* Tooltip Label (HUD Style) */}
            <span 
              className={cn(
                "absolute left-14 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-700 text-xs font-mono text-slate-200 shadow-xl backdrop-blur-sm transition-all duration-500 ease-out pointer-events-none whitespace-nowrap",
                // Base state: Invisible & geser ke kiri
                "opacity-0 -translate-x-4",
                // Hover state: Visible
                "group-hover:opacity-100 group-hover:translate-x-0",
                // Flash state: Visible (Prioritas)
                isLabelVisible && "opacity-100 translate-x-0"
              )}
            >
              {item.label}
              
              {/* Panah kecil di kiri label */}
              <span className="absolute -left-1 top-1/2 -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-transparent border-r-slate-700/50" />
            </span>

            {/* Icon Circle */}
            <button
              onClick={() => scrollTo(item.id)}
              className={cn(
                "relative flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                isActive 
                  ? `scale-110 border-white/10 ${item.bg} shadow-[0_0_20px_-5px_currentColor] ${item.color}` 
                  : "scale-100 border-transparent bg-slate-900/50 text-slate-500 hover:bg-slate-800 hover:scale-105 hover:text-slate-300"
              )}
              aria-label={`Scroll to ${item.label}`}
            >
              <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              
              {isActive && (
                <motion.div
                  layoutId="active-dot"
                  className={cn("absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-slate-950 bg-current")}
                />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}