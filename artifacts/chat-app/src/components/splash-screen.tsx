import { useEffect, useState } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 800);
    const t2 = setTimeout(() => setPhase("exit"), 2000);
    const t3 = setTimeout(() => onComplete(), 2700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background overflow-hidden"
      style={{
        opacity: phase === "exit" ? 0 : 1,
        transition: phase === "exit" ? "opacity 0.6s ease-in-out" : "none",
        pointerEvents: phase === "exit" ? "none" : "auto",
      }}
    >
      {/* Animated geometric rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute rounded-full border border-foreground/[0.04]"
            style={{
              width: `${i * 180}px`,
              height: `${i * 180}px`,
              animation: `splash-ring ${1.2 + i * 0.4}s ease-out forwards`,
              animationDelay: `${i * 0.1}s`,
              opacity: 0,
            }}
          />
        ))}
      </div>

      {/* Corner accent lines */}
      <div className="absolute inset-0 pointer-events-none">
        {[
          { top: "10%", left: "8%", rotate: 0 },
          { top: "10%", right: "8%", rotate: 90 },
          { bottom: "10%", left: "8%", rotate: 270 },
          { bottom: "10%", right: "8%", rotate: 180 },
        ].map((pos, idx) => (
          <div
            key={idx}
            className="absolute w-10 h-10"
            style={{
              ...pos,
              transform: `rotate(${pos.rotate}deg)`,
              animation: `splash-corner 0.8s ease-out forwards`,
              animationDelay: `${0.3 + idx * 0.05}s`,
              opacity: 0,
            }}
          >
            <div className="w-full h-px bg-foreground/20" />
            <div className="w-px h-full bg-foreground/20 absolute top-0 left-0" />
          </div>
        ))}
      </div>

      {/* Central content */}
      <div
        className="relative z-10 flex flex-col items-center"
        style={{
          animation: "splash-center 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards",
          opacity: 0,
        }}
      >
        {/* Logo with glow */}
        <div
          className="relative mb-6"
          style={{
            animation: "splash-logo-glow 1.8s ease-in-out infinite alternate",
            animationDelay: "0.5s",
          }}
        >
          <div
            className="absolute inset-0 rounded-full blur-2xl bg-foreground/5 scale-150"
            style={{ animation: "splash-pulse 1.5s ease-in-out infinite" }}
          />
          <img
            src="/zei-logo.png"
            alt="Zaheen.AI Logo"
            className="w-20 h-20 object-contain relative z-10"
          />
        </div>

        {/* Brand name — letters stagger in */}
        <div className="overflow-hidden mb-1">
          <p
            className="text-3xl font-bold tracking-[0.4em] text-foreground uppercase"
            style={{
              animation: "splash-slide-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards",
              animationDelay: "0.25s",
              opacity: 0,
              transform: "translateY(100%)",
            }}
          >
            Zaheen Student.AI
          </p>
        </div>

        {/* Tagline */}
        <div className="overflow-hidden">
          <p
            className="text-[10px] tracking-[0.45em] text-muted-foreground uppercase"
            style={{
              animation: "splash-slide-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards",
              animationDelay: "0.4s",
              opacity: 0,
              transform: "translateY(100%)",
            }}
          >
            For Your Daily Education Guide
          </p>
        </div>

        {/* Loading dots */}
        <div className="flex gap-1.5 mt-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1 h-1 rounded-full bg-foreground/25"
              style={{
                animation: "splash-dot 1.2s ease-in-out infinite",
                animationDelay: `${0.6 + i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Keyframe styles */}
      <style>{`
        @keyframes splash-center {
          from { opacity: 0; transform: scale(0.88) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes splash-slide-up {
          from { opacity: 0; transform: translateY(100%); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes splash-ring {
          0%   { opacity: 0; transform: scale(0.4); }
          50%  { opacity: 0.6; }
          100% { opacity: 0; transform: scale(1.15); }
        }
        @keyframes splash-corner {
          from { opacity: 0; transform: scale(0.5) rotate(var(--tw-rotate, 0deg)); }
          to   { opacity: 1; transform: scale(1) rotate(var(--tw-rotate, 0deg)); }
        }
        @keyframes splash-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1.4); }
          50%       { opacity: 0.8; transform: scale(1.6); }
        }
        @keyframes splash-logo-glow {
          from { filter: brightness(1); }
          to   { filter: brightness(1.05); }
        }
        @keyframes splash-dot {
          0%, 80%, 100% { transform: scale(1); opacity: 0.25; }
          40%            { transform: scale(1.5); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
