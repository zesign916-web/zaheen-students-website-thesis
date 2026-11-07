import { useState, type MouseEvent } from "react";
import { Link, useLocation } from "wouter";
import { TypewriterHeading } from "@/components/typewriter-heading";

export default function HomePage() {
  const [, setLocation] = useLocation();
  const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(null);

  const launchAI = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    setRipple({ x: event.clientX - bounds.left, y: event.clientY - bounds.top, id: Date.now() });
    window.setTimeout(() => setLocation("/ai"), 320);
  };

  return (
    <main className="site-page min-h-screen bg-white text-neutral-950">
      <header className="site-header mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
        <Link href="/" className="brand-link flex items-center gap-3" aria-label="ZahinStudent home">
          <img src="/zei-wordmark.png" alt="ZAHIN Student" className="h-12 w-auto object-contain" />
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="text-neutral-900">Home</Link>
          <Link href="/about" className="text-neutral-500 transition-colors hover:text-neutral-900">About Us</Link>
        </nav>
      </header>
      <section className="home-hero relative mx-auto flex min-h-[calc(100svh-88px)] max-w-6xl flex-col items-center justify-center overflow-hidden px-6 pb-24 pt-8 text-center sm:min-h-[calc(100svh-96px)] sm:px-10 sm:pb-28">
        <div className="hero-ambient" aria-hidden="true"><span /><span /><span /><i /><i /></div>
        <img src="/zei-mark.png" alt="ZahinStudent mark" className="hero-mark relative z-10 mb-10 h-[76px] w-[76px] object-contain sm:mb-12 sm:h-20 sm:w-20" />
        <p className="hero-intro relative z-10 mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">A learning initiative for every student</p>
        <h1 className="relative z-10 min-h-[2.2em] max-w-4xl text-4xl font-semibold leading-tight tracking-tight sm:min-h-[1.25em] sm:text-6xl" aria-label="Empowering Students Through Ethical AI.">
          <span aria-hidden="true"><TypewriterHeading text="Empowering Students Through Ethical AI." /></span>
        </h1>
        <p className="hero-description relative z-10 mt-7 max-w-2xl text-base leading-7 text-neutral-600 sm:text-lg sm:leading-8">An educational initiative bringing intelligent AI tools, learning assistance, and digital resources together to support students in their academic journey.</p>
        <div className="relative z-10 mt-11 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <Link href="/about" className="hero-button hero-button-secondary inline-flex min-h-12 items-center justify-center rounded-md border border-neutral-300 px-7 text-sm font-medium">About Us</Link>
          <Link href="/ai" onClick={launchAI} className="hero-button hero-button-primary relative inline-flex min-h-12 items-center justify-center overflow-hidden rounded-md bg-neutral-950 px-7 text-sm font-medium text-white">
            <span className="relative z-10">Launch AI</span>
            {ripple && <span key={ripple.id} className="button-ripple" style={{ left: ripple.x, top: ripple.y }} />}
          </Link>
        </div>
      </section>
    </main>
  );
}
