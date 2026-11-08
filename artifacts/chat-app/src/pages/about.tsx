import { Link } from "wouter";
import { TypewriterHeading } from "@/components/typewriter-heading";
import { TypeOnceText } from "@/components/type-once-text";
import { BrandImage } from "@/components/brand-image";

export default function AboutPage() {
  return (
    <main className="site-page min-h-screen bg-white text-neutral-950">
      <header className="site-header mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
        <Link href="/" className="brand-link flex items-center gap-3" aria-label="Zaheen Student home">
          <BrandImage filename="zei-wordmark.png" alt="Zaheen Student" className="h-12 w-auto object-contain" width={220} height={48} />
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="text-neutral-500 transition-colors hover:text-neutral-900"><TypeOnceText text="Home" /></Link>
          <Link href="/about" className="text-neutral-900"><TypeOnceText text="About Us" delay={120} /></Link>
        </nav>
      </header>
      <div className="mx-auto max-w-5xl px-6 pb-24 sm:px-10">
        <section className="about-hero py-14 text-center sm:py-20">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500"><TypeOnceText text="About Zaheen Student" delay={300} /></p>
          <h1 className="about-heading mx-auto min-h-[2.2em] max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:min-h-[1.25em] sm:text-6xl" aria-label="An Initiative for the Future of Education.">
            <span aria-hidden="true"><TypewriterHeading text="An Initiative for the Future of Education." typingDuration={5000} /></span>
          </h1>
          <p className="hero-description mx-auto mt-7 max-w-2xl text-base leading-7 text-neutral-600 sm:text-lg sm:leading-8"><TypeOnceText text="Making artificial intelligence more accessible, responsible, and useful for students." delay={550} /></p>
        </section>

        <section className="about-content border-t border-neutral-200 py-12 sm:py-14">
          <h2 className="text-2xl font-semibold tracking-tight"><TypeOnceText text="About the Project" /></h2>
          <div className="mt-5 max-w-3xl space-y-4 text-[15px] leading-7 text-neutral-600">
            <p><TypeOnceText text="Zaheen Student is an educational technology initiative developed to explore the responsible and ethical integration of artificial intelligence into education." delay={250} /></p>
            <p><TypeOnceText text="The project aims to provide students with accessible AI-powered tools that support learning, understanding, research, and academic development." delay={500} /></p>
            <p><TypeOnceText text="Rather than encouraging students to depend blindly on AI, the initiative promotes its responsible use as an educational assistant." delay={750} /></p>
            <p><TypeOnceText text="The long-term vision is to develop a comprehensive educational ecosystem where students can access useful digital tools and learning resources in one place." delay={1000} /></p>
          </div>
        </section>

        <section className="about-content grid gap-10 border-t border-neutral-200 py-12 sm:grid-cols-2 sm:py-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500"><TypeOnceText text="Created by" delay={250} /></p>
            <h2 className="mt-3 text-xl font-semibold"><TypeOnceText text="Faisal Zahir" delay={450} /></h2>
            <p className="mt-3 text-sm leading-6 text-neutral-600"><TypeOnceText text="Student at Government College Lahore. Studying B.S. English Literature." delay={650} /></p>
            <p className="mt-3 text-sm leading-6 text-neutral-600"><TypeOnceText text="The project represents an independent effort to make educational technology more accessible and meaningful for students." delay={950} /></p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500"><TypeOnceText text="Academic supervision" delay={400} /></p>
            <h2 className="mt-3 text-xl font-semibold"><TypeOnceText text="Ma'am Sumbal Maqsood" delay={600} /></h2>
            <div className="mt-4 rounded-lg border border-dashed border-neutral-300 px-5 py-6 text-sm leading-6 text-neutral-500"><TypeOnceText text="Academic profile and professional information may be added here." delay={800} /></div>
          </div>
        </section>

        <section className="about-content border-t border-neutral-200 py-12 sm:py-14">
          <h2 className="text-2xl font-semibold tracking-tight"><TypeOnceText text="Responsible AI. Ethical Learning." delay={200} /></h2>
          <div className="mt-5 max-w-3xl space-y-4 text-[15px] leading-7 text-neutral-600">
            <p><TypeOnceText text="Zaheen Student AI is designed exclusively for educational purposes. Its primary objective is to assist students in understanding academic concepts, exploring ideas, conducting educational research, and improving their learning experience." delay={400} /></p>
            <p><TypeOnceText text="The platform does not intend to facilitate academic dishonesty, examination cheating, plagiarism, or the submission of AI-generated work as a student's independent effort." delay={650} /></p>
            <p><TypeOnceText text="AI tools are intended to support learning rather than replace independent thinking, academic effort, or human judgement. The platform operates under an educational framework that prioritises responsible AI usage, academic integrity, and ethical learning practices." delay={900} /></p>
            <p><TypeOnceText text="Users should independently verify important information generated by AI, as AI systems can occasionally produce inaccurate or incomplete responses." delay={1150} /></p>
          </div>
          <aside className="mt-8 rounded-lg border border-neutral-200 bg-neutral-50 px-5 py-4 text-sm leading-6 text-neutral-600"><TypeOnceText text="Zaheen Student is an ongoing educational technology initiative. Its tools, features, and policies are continuously being developed and refined." delay={1400} /></aside>
        </section>
      </div>
    </main>
  );
}
