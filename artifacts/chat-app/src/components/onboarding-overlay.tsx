import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, GraduationCap, Heart, Sparkles } from "lucide-react";

interface Props {
  onDone: () => void;
}

const levels = ["School", "College / Intermediate", "Undergraduate", "Postgraduate"];
const interests = ["Science", "Technology", "Medicine", "Engineering", "Business", "Arts & Humanities", "Social Sciences", "Law"];
const learningStyles = ["Visual explanations", "Step-by-step guidance", "Examples & practice", "Short summaries"];

export function OnboardingOverlay({ onDone }: Props) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({ age: "", level: "", institution: "", subjects: "", hobbies: "", interests: [] as string[], learning: "", career: "" });
  const update = (key: keyof typeof profile, value: string) => setProfile(current => ({ ...current, [key]: value }));
  const toggleInterest = (value: string) => setProfile(current => ({ ...current, interests: current.interests.includes(value) ? current.interests.filter(item => item !== value) : [...current.interests, value] }));
  const finish = () => {
    localStorage.setItem("zei_learning_profile", JSON.stringify(profile));
    localStorage.setItem("zei_onboarding_complete", "true");
    onDone();
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-y-auto bg-background px-4 py-10 text-foreground">
      <div className="absolute inset-0 bg-cover bg-center opacity-35" style={{ backgroundImage: "url('/login-bg.png')" }} />
      <section className="relative w-full max-w-xl rounded-3xl border border-border bg-white/95 p-6 shadow-xl backdrop-blur md:p-9">
        <div className="mb-7 flex items-center justify-between">
          <div className="flex items-center gap-3"><img src="/zei-mark.png" alt="Zaheen Student.AI" className="h-10 w-10 object-contain" /><div><p className="text-sm font-semibold">Build your learning profile</p><p className="text-xs text-muted-foreground">Personalise your study companion</p></div></div>
          <button onClick={finish} className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">Skip</button>
        </div>
        <div className="mb-7 flex gap-2">{[0, 1, 2].map(item => <span key={item} className={`h-1.5 flex-1 rounded-full ${item <= step ? "bg-foreground" : "bg-muted"}`} />)}</div>
        {step === 0 && <div className="animate-in fade-in duration-200">
          <GraduationCap className="mb-4 h-6 w-6" /><h1 className="text-2xl font-semibold tracking-tight">Where are you in your studies?</h1><p className="mt-2 text-sm text-muted-foreground">Choose your current level and share a few basics. You can skip any question.</p>
          <label className="mt-6 block text-xs font-medium">Age (optional)<input type="number" min="8" max="100" value={profile.age} onChange={e => update("age", e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-neutral-500" placeholder="Your age" /></label>
          <label className="mt-4 block text-xs font-medium">Educational level<select value={profile.level} onChange={e => update("level", e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-neutral-500"><option value="">Select your level</option>{levels.map(level => <option key={level}>{level}</option>)}</select></label>
          <label className="mt-4 block text-xs font-medium">School, college, or university<input value={profile.institution} onChange={e => update("institution", e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-neutral-500" placeholder="Institution name (optional)" /></label>
        </div>}
        {step === 1 && <div className="animate-in fade-in duration-200">
          <Sparkles className="mb-4 h-6 w-6" /><h1 className="text-2xl font-semibold tracking-tight">What are you curious about?</h1><p className="mt-2 text-sm text-muted-foreground">Pick any subjects that interest you, then add your own.</p>
          <div className="mt-5 flex flex-wrap gap-2">{interests.map(item => <button type="button" key={item} onClick={() => toggleInterest(item)} className={`rounded-full border px-3 py-2 text-sm transition ${profile.interests.includes(item) ? "border-foreground bg-foreground text-white" : "border-border hover:border-neutral-500"}`}>{item}</button>)}</div>
          <label className="mt-5 block text-xs font-medium">Subjects you study<input value={profile.subjects} onChange={e => update("subjects", e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-neutral-500" placeholder="e.g. Biology, Mathematics, English" /></label>
          <label className="mt-4 block text-xs font-medium">Hobbies and activities<input value={profile.hobbies} onChange={e => update("hobbies", e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-neutral-500" placeholder="What do you enjoy outside class?" /></label>
        </div>}
        {step === 2 && <div className="animate-in fade-in duration-200">
          <Heart className="mb-4 h-6 w-6" /><h1 className="text-2xl font-semibold tracking-tight">How do you like to learn?</h1><p className="mt-2 text-sm text-muted-foreground">This helps Zaheen tailor explanations to you.</p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">{learningStyles.map(item => <button type="button" key={item} onClick={() => update("learning", item)} className={`rounded-xl border p-3 text-left text-sm transition ${profile.learning === item ? "border-foreground bg-muted font-medium" : "border-border hover:border-neutral-500"}`}>{item}</button>)}</div>
          <label className="mt-5 block text-xs font-medium">Career interests<input value={profile.career} onChange={e => update("career", e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-neutral-500" placeholder="Fields or careers you want to explore" /></label>
          <p className="mt-5 text-xs text-muted-foreground">Your answers are saved only in this browser for this frontend preview.</p>
        </div>}
        <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
          <button onClick={() => setStep(current => Math.max(0, current - 1))} disabled={step === 0} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:invisible"><ArrowLeft className="h-4 w-4" /> Back</button>
          {step < 2 ? <button onClick={() => setStep(current => Math.min(2, current + 1))} className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-medium text-background transition hover:opacity-80">Continue <ArrowRight className="h-4 w-4" /></button> : <button onClick={finish} className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-medium text-background transition hover:opacity-80"><Check className="h-4 w-4" /> Finish setup</button>}
        </div>
      </section>
    </main>
  );
}
