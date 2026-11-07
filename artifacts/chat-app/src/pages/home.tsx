import { Link } from "wouter";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 sm:px-10">
        <Link href="/" className="flex items-center gap-3" aria-label="ZahinStudent home">
          <img src="/zei-wordmark.png" alt="Zaheen Student" className="h-10 w-auto object-contain" />
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="text-neutral-900">Home</Link>
          <Link href="/about" className="text-neutral-500 transition-colors hover:text-neutral-900">About Us</Link>
        </nav>
      </header>
      <section className="mx-auto flex min-h-[calc(100svh-88px)] max-w-6xl flex-col items-center justify-center px-6 pb-20 text-center sm:px-10">
        <img src="/zei-mark.png" alt="Zaheen Student mark" className="mb-8 h-16 w-16 object-contain" />
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">A learning initiative for every student</p>
        <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">Empowering Students Through <span className="font-serif font-normal italic">Ethical AI.</span></h1>
        <p className="mt-7 max-w-2xl text-base leading-7 text-neutral-600 sm:text-lg sm:leading-8">An educational initiative bringing intelligent AI tools, learning assistance, and digital resources together to support students in their academic journey.</p>
        <div className="mt-10 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <Link href="/about" className="inline-flex min-h-12 items-center justify-center rounded-md border border-neutral-300 px-7 text-sm font-medium transition-colors hover:bg-neutral-50">About Us</Link>
          <Link href="/ai" className="inline-flex min-h-12 items-center justify-center rounded-md bg-neutral-950 px-7 text-sm font-medium text-white transition-colors hover:bg-neutral-800">Launch AI</Link>
        </div>
      </section>
    </main>
  );
}
