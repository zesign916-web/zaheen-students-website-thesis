import { useState, FormEvent } from "react";
import { useAuth } from "@/hooks/use-auth";
import { brandAsset } from "@/lib/brand-assets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PostLoginPreloader } from "@/components/post-login-preloader";
import { useLanguage } from "@/hooks/use-language";
import type { Language } from "@/lib/translations";
import { ArrowLeft, ArrowRight, User, Mail, Phone, Shield, ChevronDown, Eye, EyeOff } from "lucide-react";

type Screen = "welcome" | "register" | "login";
type Gender = "man" | "female" | "other" | "prefer_not_to_say" | "";

function createPreviewUser(email: string, name?: string, username?: string) {
  return { id: `preview-${crypto.randomUUID()}`, name: name || email.split("@")[0], email, username, createdAt: new Date().toISOString(), authProvider: "frontend-preview", isGuest: false };
}

const STYLES = `
  @keyframes liquidFill {
    0%   { clip-path: inset(100% 0 0 0); }
    100% { clip-path: inset(0% 0 0 0); }
  }
  @keyframes waveLine {
    0%   { border-radius: 40% 60% 55% 45% / 6px 6px 6px 6px; transform: translateX(-50%) scaleX(1); }
    33%  { border-radius: 60% 40% 45% 55% / 6px 6px 6px 6px; transform: translateX(-50%) scaleX(1.04); }
    66%  { border-radius: 45% 55% 60% 40% / 6px 6px 6px 6px; transform: translateX(-50%) scaleX(0.97); }
    100% { border-radius: 40% 60% 55% 45% / 6px 6px 6px 6px; transform: translateX(-50%) scaleX(1); }
  }
  @keyframes wavePos {
    0%   { bottom: 0%; }
    100% { bottom: 100%; }
  }
  @keyframes brandSlideUp {
    0%   { opacity: 0; transform: translateY(8px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes cardFadeIn {
    0%   { opacity: 0; transform: translateY(18px) scale(0.98); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes pulseGlow {
    0%, 100% { opacity: 0.4; }
    50%       { opacity: 0.7; }
  }
  @keyframes fadeSlideIn {
    0%   { opacity: 0; transform: translateX(16px); }
    100% { opacity: 1; transform: translateX(0); }
  }
  .login-liquid-fill {
    animation: liquidFill 2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    animation-delay: 0.3s;
    clip-path: inset(100% 0 0 0);
  }
  .login-wave-pos {
    animation: wavePos 2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    animation-delay: 0.3s;
    bottom: 0%;
  }
  .login-wave-shape { animation: waveLine 0.9s ease-in-out infinite; }
  .brand-slide {
    animation: brandSlideUp 0.55s ease forwards;
    animation-delay: 2s;
    opacity: 0;
  }
  .card-fadein {
    animation: cardFadeIn 0.6s ease forwards;
    animation-delay: 0.1s;
    opacity: 0;
  }
  .pulse-glow { animation: pulseGlow 1.8s ease-in-out infinite; }
  .step-fadein {
    animation: fadeSlideIn 0.3s ease forwards;
  }
  .social-btn-google {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    padding: 0.6rem 0.5rem;
    border-radius: 0.75rem;
    border: 1.5px solid #dadce0;
    background: #fff;
    color: #3c4043;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    opacity: 1;
    white-space: nowrap;
    transition: background 0.2s ease, border-color 0.2s ease;
  }
  .social-btn-google:hover { background: #f4f4f5; border-color: #a1a1aa; }
  .social-btn-facebook {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    padding: 0.6rem 0.5rem;
    border-radius: 0.75rem;
    border: 1.5px solid #1877F2;
    background: #1877F2;
    color: #fff;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: not-allowed;
    opacity: 0.7;
    white-space: nowrap;
  }
  .gender-pill {
    flex: 1;
    padding: 0.55rem 0.75rem;
    border-radius: 0.875rem;
    border: 1.5px solid hsl(var(--border));
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
    text-align: center;
    background: transparent;
    color: hsl(var(--foreground));
    position: relative;
    overflow: hidden;
  }
  .gender-pill:active { transform: scale(0.94); }
  .gender-pill.selected {
    border-color: hsl(var(--foreground));
    background: hsl(var(--foreground));
    color: hsl(var(--background));
    box-shadow: 0 2px 10px rgba(0,0,0,0.18);
    transform: scale(1.04);
    font-weight: 700;
  }
  .gender-pill:hover:not(.selected) {
    border-color: hsl(var(--foreground) / 0.45);
    background: hsl(var(--foreground) / 0.07);
  }
`;

function Logo({ animate = false }: { animate?: boolean }) {
  return (
    <div className="relative w-12 h-12">
      <div
        className="absolute inset-0 rounded-2xl pulse-glow"
        style={{ background: "radial-gradient(circle, rgba(0,0,0,0.06) 0%, transparent 70%)", transform: "scale(1.5)" }}
      />
      <img src={brandAsset("zei-logo.png")} alt="" aria-hidden className="absolute inset-0 w-full h-full object-contain" style={{ opacity: 0.1, filter: "grayscale(1)" }} />
      <img src={brandAsset("zei-logo.png")} alt="Zehn.AI Logo" className={`absolute inset-0 w-full h-full object-contain ${animate ? "login-liquid-fill" : ""}`} />
      {animate && (
        <div className="absolute left-1/2 login-wave-pos pointer-events-none" style={{ width: "120%", height: "8px" }}>
          <div className="login-wave-shape w-full h-full" style={{ background: "rgba(255,255,255,0.3)", position: "absolute", left: 0, top: "-3px" }} />
        </div>
      )}
    </div>
  );
}

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 mb-5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${i < current ? "w-6 h-1.5 bg-foreground" : i === current ? "w-3 h-1.5 bg-foreground" : "w-2 h-1.5 bg-border"}`}
        />
      ))}
    </div>
  );
}

function SocialButtons() {
  return (
    <div className="flex gap-2">
      <button className="social-btn-google" title="Google sign-in will be connected later" onClick={() => window.alert("Google sign-in is a UI preview and is not connected yet.")}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Google
      </button>
      <button className="social-btn-facebook" disabled title="Coming soon">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="#fff" style={{ flexShrink: 0 }}>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
        Facebook
      </button>
    </div>
  );
}

// ─── Welcome Screen ───────────────────────────────────────────────────────────
function WelcomeScreen({ onRegister, onLogin, onGuest, language, setLanguage, t }: {
  onRegister: () => void;
  onLogin: () => void;
  onGuest: () => void;
  language: string;
  setLanguage: (l: Language) => void;
  t: Record<string, string>;
}) {
  return (
    <>
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setLanguage((language === "en" ? "ur" : "en") as Language)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide border border-border/60 bg-card/70 backdrop-blur-md text-foreground shadow-sm hover:bg-card/90 transition-colors"
        >
          <span className="text-base leading-none">{language === "en" ? "🇵🇰" : "🇬🇧"}</span>
          <span>{language === "en" ? "اردو" : "EN"}</span>
        </button>
      </div>

      <div className="relative z-10 w-full max-w-sm mx-4">
        <div className="card-fadein bg-card/80 backdrop-blur-md border border-border/60 rounded-3xl shadow-xl p-8">

          {/* Brand */}
          <div className="flex flex-col items-center mb-7">
            <div className="mb-4"><Logo animate /></div>
            <div className="brand-slide flex flex-col items-center gap-0.5">
              <h1 className="text-xl font-bold tracking-widest text-foreground">Zaheen Student.AI</h1>
              <p className="text-[10px] text-muted-foreground tracking-[0.2em] mt-0.5">Your daily education guide</p>
            </div>
          </div>

          {/* Primary CTA */}
          <Button
            onClick={onRegister}
            className="w-full h-12 rounded-xl font-semibold tracking-wide text-sm mb-3"
          >
            Create Account
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-border/60" />
            <span className="text-[10px] text-muted-foreground tracking-widest uppercase">or</span>
            <div className="flex-1 h-px bg-border/60" />
          </div>

          {/* Social */}
          <SocialButtons />

          {/* Login link */}
          <p className="text-center text-xs text-muted-foreground mt-5">
            Already have an account?{" "}
            <button onClick={onLogin} className="font-semibold text-foreground underline underline-offset-2 hover:opacity-70 transition-opacity">
              Log In
            </button>
          </p>

          {/* Guest */}
          <div className="flex justify-center mt-4 pt-4 border-t border-border/40">
            <button
              onClick={onGuest}
              className="text-[11px] text-muted-foreground/70 hover:text-muted-foreground transition-colors underline underline-offset-2"
            >
              Continue as Guest
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground/50 mt-4">{t.footerText}</p>
      </div>
    </>
  );
}

// Corner arrow nav button — inside the card boundary
function CornerArrow({ direction, onClick, disabled }: {
  direction: "left" | "right";
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`
        absolute ${direction === "left" ? "left-3 top-3" : "right-3 top-3"}
        w-8 h-8 rounded-full flex items-center justify-center z-10
        bg-foreground text-background shadow-md
        transition-all duration-200
        ${disabled
          ? "opacity-20 cursor-not-allowed"
          : "opacity-100 hover:opacity-70 active:scale-95 cursor-pointer"}
      `}
      aria-label={direction === "left" ? "Back" : "Next"}
    >
      {direction === "left"
        ? <ArrowLeft className="w-3.5 h-3.5" />
        : <ArrowRight className="w-3.5 h-3.5" />}
    </button>
  );
}

// ─── Register Flow ─────────────────────────────────────────────────────────────
function RegisterFlow({ onBack, onSuccess, t }: {
  onBack: () => void;
  onSuccess: (user: unknown) => void;
  t: Record<string, string>;
}) {
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 4;

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<Gender>("");
  const [genderCustom, setGenderCustom] = useState("");
  const [preferNotToSay, setPreferNotToSay] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stepDir, setStepDir] = useState<"fwd" | "bwd">("fwd");

  const handleGenderSelect = (g: "man" | "female" | "other") => {
    if (g === "other") {
      setGender("other");
      setPreferNotToSay(false);
    } else {
      setGender(g);
      setGenderCustom("");
      setPreferNotToSay(false);
    }
    setError(null);
  };

  const goBack = () => {
    setError(null);
    setStepDir("bwd");
    if (step === 1) onBack();
    else setStep(s => s - 1);
  };

  const goNext = () => {
    setError(null);
    if (step === 1) {
      if (!fullName.trim()) { setError("Please enter your full name."); return; }
      if (username.trim().length < 3) { setError("Choose a username with at least 3 characters."); return; }
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setError("Please enter a valid email address."); return;
      }
    }
    if (step === 3) {
      if (!gender) { setError("Please select a gender option."); return; }
      if (gender === "other" && !preferNotToSay && !genderCustom.trim()) {
        setError("Please describe your gender or choose 'Prefer not to say'."); return;
      }
    }
    setStepDir("fwd");
    if (step < TOTAL_STEPS) setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    if (!agreedToTerms) { setError("Please agree to the terms to continue."); return; }
    if (password.length < 8) { setError("Choose a password with at least 8 characters."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setIsLoading(true);
    setError(null);
    try {
      const finalGender = preferNotToSay ? "prefer_not_to_say" : gender;
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          gender: finalGender || undefined,
          genderCustom: gender === "other" && !preferNotToSay ? genderCustom.trim() : undefined,
          agreedToTerms: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); setIsLoading(false); return; }
      onSuccess({ ...data, username: username.trim() });
    } catch {
      onSuccess(createPreviewUser(email.trim(), fullName.trim(), username.trim()));
    } finally {
      setIsLoading(false);
    }
  };

  const canGoNext = step === 1
    ? fullName.trim().length > 0 && username.trim().length >= 3 && email.trim().length > 0
    : step === 2
      ? phone.trim().length > 0
      : step === 3
        ? !!gender
        : true;

  return (
    <div className="relative z-10 w-full max-w-sm mx-4">
      <div className="relative card-fadein bg-card/80 backdrop-blur-md border border-border/60 rounded-3xl shadow-xl p-8">

        {/* Floating corner arrows */}
        <CornerArrow direction="left" onClick={goBack} disabled={isLoading} />
        {step < TOTAL_STEPS && (
          <CornerArrow direction="right" onClick={goNext} disabled={!canGoNext || isLoading} />
        )}

        {/* Header */}
        <div className="flex flex-col items-center mb-5">
          <Logo />
          <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mt-3">CREATE ACCOUNT</p>
        </div>

        <StepDots total={TOTAL_STEPS} current={step - 1} />

        {/* ── Step 1: Name + Email ── */}
        {step === 1 && (
          <div key={1} className={`${stepDir === "fwd" ? "zt-fwd" : "zt-bwd"} space-y-4`}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">Basic Info</p>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium tracking-wide uppercase text-muted-foreground">Full Name</Label>
                  <Input
                    type="text"
                    placeholder="e.g. Ali Hassan"
                    value={fullName}
                    onChange={e => { setFullName(e.target.value); setError(null); }}
                    className="rounded-xl h-11"
                    autoFocus
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium tracking-wide uppercase text-muted-foreground">Username</Label>
                  <Input type="text" placeholder="Choose a username" value={username} onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_.-]/g, ""))} className="rounded-xl h-11" autoComplete="username" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium tracking-wide uppercase text-muted-foreground">Email Address</Label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(null); }}
                    className="rounded-xl h-11"
                    autoComplete="email"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-border/60" />
                <span className="text-[10px] text-muted-foreground tracking-widest uppercase">or sign up with</span>
                <div className="flex-1 h-px bg-border/60" />
              </div>
              <SocialButtons />
            </div>

            {error && <p className="text-xs text-destructive text-center">{error}</p>}
          </div>
        )}

        {/* ── Step 2: Phone ── */}
        {step === 2 && (
          <div key={2} className={`${stepDir === "fwd" ? "zt-fwd" : "zt-bwd"} space-y-4`}>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">Phone Number</p>
              </div>
              <p className="text-xs text-muted-foreground">Optional, used for account recovery only.</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium tracking-wide uppercase text-muted-foreground">Phone</Label>
              <Input
                type="tel"
                placeholder="+92 300 0000000"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="rounded-xl h-11"
                autoFocus
                autoComplete="tel"
              />
            </div>
            {error && <p className="text-xs text-destructive text-center">{error}</p>}
            <button onClick={() => { setStepDir("fwd"); goNext(); }} className="w-full text-center text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors py-1">
              Skip →
            </button>
          </div>
        )}

        {/* ── Step 3: Gender ── */}
        {step === 3 && (
          <div key={3} className={`${stepDir === "fwd" ? "zt-fwd" : "zt-bwd"} space-y-4`}>
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">Gender</p>
              <p className="text-xs text-muted-foreground mb-4">How would you like to identify?</p>

              <div className="flex gap-2 mb-3">
                <button className={`gender-pill ${gender === "man" ? "selected" : ""}`} onClick={() => handleGenderSelect("man")}>Man</button>
                <button className={`gender-pill ${gender === "female" ? "selected" : ""}`} onClick={() => handleGenderSelect("female")}>Female</button>
                <button className={`gender-pill ${gender === "other" || gender === "prefer_not_to_say" ? "selected" : ""}`} onClick={() => handleGenderSelect("other")}>
                  Others {(gender === "other" || gender === "prefer_not_to_say") ? <ChevronDown className="inline w-3 h-3 ml-0.5" /> : null}
                </button>
              </div>

              {(gender === "other" || gender === "prefer_not_to_say") && (
                <div className="step-fadein space-y-3 bg-muted/40 rounded-xl p-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium tracking-wide uppercase text-muted-foreground">Write it down (optional)</Label>
                    <Input
                      type="text"
                      placeholder="Describe how you identify..."
                      value={genderCustom}
                      onChange={e => { setGenderCustom(e.target.value); if (preferNotToSay) { setPreferNotToSay(false); setGender("other"); } }}
                      className="rounded-xl h-10 text-sm"
                      disabled={preferNotToSay}
                      autoFocus
                      maxLength={60}
                    />
                  </div>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferNotToSay}
                      onChange={e => {
                        setPreferNotToSay(e.target.checked);
                        if (e.target.checked) { setGenderCustom(""); setGender("prefer_not_to_say"); }
                        else setGender("other");
                      }}
                      className="w-4 h-4 rounded accent-foreground"
                    />
                    <span className="text-xs text-muted-foreground">Prefer not to say</span>
                  </label>
                </div>
              )}
            </div>

            {error && <p className="text-xs text-destructive text-center">{error}</p>}

            <button onClick={() => { setStepDir("fwd"); setGender("prefer_not_to_say"); setStep(4); }} className="w-full text-center text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors py-1">
              Skip →
            </button>
          </div>
        )}

        {/* ── Step 4: Terms ── */}
        {step === 4 && (
          <div key={4} className={`${stepDir === "fwd" ? "zt-fwd" : "zt-bwd"} space-y-4`}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">Almost there!</p>
              </div>
              <p className="text-xs text-muted-foreground mb-4">Review your details and agree to the terms.</p>

              <div className="bg-muted/40 rounded-xl p-3.5 space-y-1.5 mb-4">
                <p className="text-xs"><span className="text-muted-foreground">Name: </span><span className="font-medium text-foreground">{fullName}</span></p>
                <p className="text-xs"><span className="text-muted-foreground">Email: </span><span className="font-medium text-foreground">{email}</span></p>
                {phone && <p className="text-xs"><span className="text-muted-foreground">Phone: </span><span className="font-medium text-foreground">{phone}</span></p>}
                {gender && (
                  <p className="text-xs">
                    <span className="text-muted-foreground">Gender: </span>
                    <span className="font-medium text-foreground capitalize">
                      {gender === "prefer_not_to_say" ? "Prefer not to say" : gender === "other" && genderCustom ? genderCustom : gender}
                    </span>
                  </p>
                )}
              </div>

              <div className="space-y-3 mb-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Password</Label>
                  <div className="relative"><Input type={showPasswords ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="h-10 rounded-xl pr-11" autoComplete="new-password" placeholder="At least 8 characters" /><button type="button" onClick={() => setShowPasswords(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Toggle password visibility">{showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
                </div>
                <div className="space-y-1.5"><Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Confirm password</Label><Input type={showPasswords ? "text" : "password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="h-10 rounded-xl" autoComplete="new-password" placeholder="Re-enter your password" /></div>
                <p className="text-[10px] leading-relaxed text-muted-foreground">Frontend preview only: password authentication will be connected to the account API later and is not sent to the server.</p>
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={e => { setAgreedToTerms(e.target.checked); setError(null); }}
                  className="mt-0.5 w-4 h-4 rounded accent-foreground flex-shrink-0"
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  I agree to the{" "}
                  <span className="text-foreground font-medium underline underline-offset-2 cursor-pointer">Terms of Service</span>
                  {" "}and{" "}
                  <span className="text-foreground font-medium underline underline-offset-2 cursor-pointer">Privacy Policy</span>
                  {" "}of Zaheen Student.AI.
                </span>
              </label>
            </div>

            {error && <p className="text-xs text-destructive text-center">{error}</p>}

            <Button
              onClick={handleSubmit}
              className="w-full h-11 rounded-xl font-semibold"
              disabled={!agreedToTerms || isLoading}
            >
              {isLoading ? "Creating…" : "Create Account"}
            </Button>
          </div>
        )}
      </div>

      <p className="text-center text-[10px] text-muted-foreground/50 mt-4">{t.footerText}</p>
    </div>
  );
}

// ─── Login Screen ──────────────────────────────────────────────────────────────
function LoginScreen({ onBack, onSuccess, t }: {
  onBack: () => void;
  onSuccess: (user: unknown) => void;
  t: Record<string, string>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) { setError("Email is required."); return; }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); setIsLoading(false); return; }
      onSuccess(data);
    } catch {
      onSuccess(createPreviewUser(email.trim()));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-sm mx-4">
      <div className="card-fadein bg-card/80 backdrop-blur-md border border-border/60 rounded-3xl shadow-xl p-8">

        <div className="flex flex-col items-center mb-6">
          <Logo />
          <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mt-3">LOG IN</p>
        </div>

        <SocialButtons />

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-border/60" />
          <span className="text-[10px] text-muted-foreground tracking-widest uppercase">or with email</span>
          <div className="flex-1 h-px bg-border/60" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
              <Mail className="inline w-3 h-3 mr-1 mb-0.5" /> Email Address
            </Label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(null); }}
              disabled={isLoading}
              required
              autoComplete="email"
              autoFocus
              className="rounded-xl h-11"
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium tracking-wide uppercase text-muted-foreground">Password</Label>
              <button type="button" onClick={() => window.alert("Password recovery will be available when account services are connected.")} className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">Forgot password?</button>
            </div>
            <div className="relative">
              <Input type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" className="h-11 rounded-xl pr-11" />
              <button type="button" onClick={() => setShowPassword(value => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
          </div>

          {error && <p className="text-xs text-destructive text-center">{error}</p>}

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onBack} className="flex-1 h-11 rounded-xl" disabled={isLoading}>
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
            </Button>
            <Button type="submit" className="flex-1 h-11 rounded-xl font-semibold" disabled={isLoading || !email.trim()}>
              {isLoading ? "Logging in…" : "Log In"}
            </Button>
          </div>
        </form>

        <p className="text-[10px] text-muted-foreground/60 text-center mt-5 leading-relaxed">
          Sign-in credentials are a frontend preview; secure password authentication will be connected with the account API.
        </p>
      </div>

      <p className="text-center text-[10px] text-muted-foreground/50 mt-4">{t.footerText}</p>
    </div>
  );
}

// ─── Root Export ───────────────────────────────────────────────────────────────
export default function LoginPage() {
  const { login } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [screen, setScreen] = useState<Screen>("welcome");
  const [screenDir, setScreenDir] = useState<"fwd" | "bwd">("fwd");
  const [pendingUser, setPendingUser] = useState<unknown>(null);
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  const goScreen = (next: Screen, dir: "fwd" | "bwd") => {
    setScreenDir(dir);
    setScreen(next);
  };

  const handleSuccess = (user: unknown) => setPendingUser(user);

  const handleGuest = async () => {
    setIsGuestLoading(true);
    try {
      const res = await fetch("/api/auth/guest", { method: "POST" });
      const data = await res.json();
      if (res.ok) setPendingUser(data);
      else setPendingUser(createPreviewUser(`guest-${crypto.randomUUID()}@preview.local`, "Guest", "guest"));
    } catch {
      setPendingUser(createPreviewUser(`guest-${crypto.randomUUID()}@preview.local`, "Guest", "guest"));
    } finally {
      setIsGuestLoading(false);
    }
  };

  if (pendingUser) {
    return (
      <PostLoginPreloader
        onComplete={() => login(pendingUser as Parameters<typeof login>[0])}
      />
    );
  }

  return (
    <>
      <style>{STYLES}</style>
      <div
        className="min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{
          backgroundImage: "url('/login-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {isGuestLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <div className="text-sm text-muted-foreground animate-pulse">Starting guest session…</div>
          </div>
        )}

        <div key={screen} className={screenDir === "fwd" ? "zt-fwd" : "zt-bwd"} style={{ width: "100%", display: "flex", justifyContent: "center" }}>
          {screen === "welcome" && (
            <WelcomeScreen
              onRegister={() => goScreen("register", "fwd")}
              onLogin={() => goScreen("login", "fwd")}
              onGuest={handleGuest}
              language={language}
              setLanguage={setLanguage}
              t={t as unknown as Record<string, string>}
            />
          )}

          {screen === "register" && (
            <RegisterFlow
              onBack={() => goScreen("welcome", "bwd")}
              onSuccess={handleSuccess}
              t={t as unknown as Record<string, string>}
            />
          )}

          {screen === "login" && (
            <LoginScreen
              onBack={() => goScreen("welcome", "bwd")}
              onSuccess={handleSuccess}
              t={t as unknown as Record<string, string>}
            />
          )}
        </div>
      </div>
    </>
  );
}
