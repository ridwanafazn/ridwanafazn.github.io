import React from "react";
import Landing from "@/components/Landing";
import Sidebar from "@/components/Sidebar";
import About from "@/components/About";
import Experience from "@/components/Experience";
import Projects from "@/components/Projects";
import Head from "next/head";

export default function Home() {
  return (
    <div className="tracking-wider">
      <Head>
        <title>Im Ridwan</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Sidebar />
      <Landing />
      <About />
      <Experience />
      <Projects />
    </div>
  );
}
