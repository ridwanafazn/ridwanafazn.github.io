"use client";

import { motion } from "framer-motion";
import { 
  Terminal, Cloud, Database, Globe, Activity, Cpu, Smartphone, Layout
} from "lucide-react";

export default function TechStack() {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <section 
      id="about" 
      // UBAH DI SINI: pt-12 (lebih rapat ke atas) dan pb-24 (jarak ke bawah)
      className="pt-12 pb-24 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto"
    >
      {/* ... (sisanya sama persis) ... */}
      {/* <div className="mb-12">
        <h2 className="text-3xl font-bold text-white mb-2">Technical Arsenal</h2>
        <p className="text-slate-400">The tools I use to build scalable systems & intelligent solutions.</p>
      </div> */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[180px]">
        <motion.div 
          initial="hidden" whileInView="visible" variants={fadeIn} transition={{ duration: 0.5 }}
          className="md:col-span-1 md:row-span-2 rounded-2xl bg-slate-900/50 border border-slate-800 p-6 flex flex-col justify-between group hover:border-blue-500/50 transition-colors"
        >
          <div>
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4 text-blue-400"><Terminal size={20} /></div>
            <h3 className="text-xl font-bold text-slate-100 mb-2">Backend Systems</h3>
            <p className="text-sm text-slate-400 leading-relaxed">High-performance microservices and distributed systems. Focusing on memory safety and concurrency.</p>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {["Rust", "Golang", "C++", "gRPC", "MQTT", "Actix"].map((tag) => (
              <span key={tag} className="px-2 py-1 rounded bg-slate-800 text-xs text-slate-300 font-mono border border-slate-700">{tag}</span>
            ))}
          </div>
        </motion.div>

        <motion.div 
          initial="hidden" whileInView="visible" variants={fadeIn} transition={{ duration: 0.5, delay: 0.1 }}
          className="md:col-span-2 rounded-2xl bg-slate-900/50 border border-slate-800 p-6 flex flex-col justify-between group hover:border-teal-500/50 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="h-10 w-10 rounded-lg bg-teal-500/10 flex items-center justify-center mb-4 text-teal-400"><Cloud size={20} /></div>
              <h3 className="text-xl font-bold text-slate-100">Cloud Native & DevOps</h3>
            </div>
            <Cpu className="text-slate-800 group-hover:text-teal-500/50 transition-colors" size={40} />
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {["Google Cloud Platform", "Docker", "Kubernetes", "Terraform", "Cloud Run", "CI/CD"].map((tag) => (
              <span key={tag} className="px-2 py-1 rounded bg-slate-800 text-xs text-slate-300 font-mono border border-slate-700">{tag}</span>
            ))}
          </div>
        </motion.div>

        <motion.div 
          initial="hidden" whileInView="visible" variants={fadeIn} transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6 group hover:border-purple-500/50 transition-colors"
        >
          <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-4 text-purple-400"><Database size={20} /></div>
          <h3 className="font-bold text-slate-100 mb-1">AI & Data</h3>
          <p className="text-xs text-slate-400 mb-3">TensorFlow, Python, SQL, Redis.</p>
        </motion.div>

        <motion.div 
          initial="hidden" whileInView="visible" variants={fadeIn} transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6 group hover:border-orange-500/50 transition-colors relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Activity size={60} /></div>
          <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4 text-orange-400"><Activity size={20} /></div>
          <h3 className="font-bold text-slate-100 mb-1">On The Run</h3>
          <p className="text-xs text-slate-400">Marathon Trainee. <br/> PB 5K: 25:00</p>
        </motion.div>

        <motion.div 
          initial="hidden" whileInView="visible" variants={fadeIn} transition={{ duration: 0.5, delay: 0.4 }}
          className="md:col-span-3 rounded-2xl bg-slate-900/50 border border-slate-800 p-6 flex flex-col justify-between group hover:border-pink-500/50 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400"><Globe size={20} /></div>
               <div>
                 <h3 className="text-xl font-bold text-slate-100">Frontend & Mobile Literacy</h3>
                 <p className="text-xs text-slate-400 mt-1">Capable of building complete products with modern standards.</p>
               </div>
            </div>
            <div className="flex gap-3 text-slate-800 group-hover:text-pink-500/30 transition-colors"><Layout size={32} /><Smartphone size={32} /></div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
             {["Next.js", "Flutter", "Tailwind", "Framer Motion"].map((t) => (
               <span key={t} className="px-2 py-1 rounded bg-slate-800 text-xs text-slate-300 font-mono border border-slate-700">{t}</span>
             ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}