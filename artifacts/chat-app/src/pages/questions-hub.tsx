import { useLocation } from "wouter";
import { BookOpen, GraduationCap, Building2, ChevronRight, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

const sections = [
  { slug: "school", icon: BookOpen, titleKey: "sectionSchool", descriptionKey: "sectionSchoolDesc" },
  { slug: "colleges", icon: GraduationCap, titleKey: "sectionColleges", descriptionKey: "sectionCollegesDesc" },
  { slug: "university", icon: Building2, titleKey: "sectionUniversity", descriptionKey: "sectionUniversityDesc" },
] as const;

export default function QuestionsHubPage() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/95 px-5 py-4 backdrop-blur">
        <button onClick={() => setLocation("/")} className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {t.backToChat}
        </button>
        <div className="ml-auto flex items-center gap-3">
          <img src="/zei-mark.png" alt="Zaheen Student.AI" className="h-8 w-8 object-contain" />
          <span className="hidden text-sm font-semibold sm:inline">Zaheen Student.AI</span>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-5 py-12 md:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Student community</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{t.latestQuestions}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{t.hubDesc}</p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {sections.map(({ slug, icon: Icon, titleKey, descriptionKey }) => (
            <button key={slug} onClick={() => setLocation(`/questions/${slug}`)} className="group rounded-2xl border border-border bg-card p-6 text-left transition hover:-translate-y-0.5 hover:border-neutral-400 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-muted text-foreground"><Icon className="h-5 w-5" /></div>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1" />
              </div>
              <h2 className="mt-6 text-base font-semibold">{t[titleKey]}</h2>
              <p className="mt-2 min-h-12 text-sm leading-5 text-muted-foreground">{t[descriptionKey]}</p>
              <p className="mt-5 text-xs font-medium text-muted-foreground">50 questions <span className="mx-1">·</span> Pakistan education</p>
            </button>
          ))}
        </div>
        <div className="mt-8 rounded-2xl border border-border bg-muted/40 px-5 py-4 text-sm text-muted-foreground">
          Browse 150 questions for schools, colleges, and higher education. Choose a question to get guidance in Zaheen Student.AI.
        </div>
      </section>
    </main>
  );
}
