import { useEffect, useState, useRef } from "react";
import { brandAsset } from "@/lib/brand-assets";

const LOADING_MESSAGES = [
  "Loading your conversations…",
  "Setting up your space…",
  "Fetching your memories…",
  "Preparing your assistant…",
  "Syncing your history…",
  "Almost there…",
];

interface PostLoginPreloaderProps {
  onComplete: () => void;
}

export function PostLoginPreloader({ onComplete }: PostLoginPreloaderProps) {
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [phase, setPhase] = useState<"in" | "visible" | "out">("in");
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    // Shuffle messages randomly
    const shuffled = [...LOADING_MESSAGES].sort(() => Math.random() - 0.5);

    // Progress bar: fills over ~2.4s in random-ish steps
    const totalDuration = 2400;
    const steps = 18;
    const interval = totalDuration / steps;
    let step = 0;

    const progressTimer = setInterval(() => {
      step++;
      // Ease: fast start, slow end
      const eased = Math.min(100, Math.round((1 - Math.pow(1 - step / steps, 2.2)) * 100));
      setProgress(eased);
      if (step >= steps) clearInterval(progressTimer);
    }, interval);

    // Cycle messages every ~600ms
    let msgIdx = 0;
    const msgTimer = setInterval(() => {
      msgIdx = (msgIdx + 1) % shuffled.length;
      setMessageIndex(msgIdx);
    }, 620);

    // Exit animation at ~2.6s, unmount at ~3.1s
    const exitTimer = setTimeout(() => setPhase("out"), 2600);
    const doneTimer = setTimeout(() => onCompleteRef.current(), 3100);

    return () => {
      clearInterval(progressTimer);
      clearInterval(msgTimer);
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  const messages = [...LOADING_MESSAGES].sort(() => 0); // stable ref
  const currentMessage = LOADING_MESSAGES[messageIndex % LOADING_MESSAGES.length];

  return (
    <>
      <style>{`
        @keyframes plIn {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes plOut {
          from { opacity: 1; transform: scale(1); }
          to   { opacity: 0; transform: scale(1.03); }
        }
        @keyframes plLiquidFill {
          0%   { clip-path: inset(100% 0 0 0); }
          100% { clip-path: inset(0% 0 0 0); }
        }
        @keyframes plWavePos {
          0%   { bottom: 0%; }
          100% { bottom: 100%; }
        }
        @keyframes plWaveShape {
          0%   { border-radius: 40% 60% 55% 45% / 6px 6px 6px 6px; transform: translateX(-50%) scaleX(1); }
          33%  { border-radius: 60% 40% 45% 55% / 6px 6px 6px 6px; transform: translateX(-50%) scaleX(1.04); }
          66%  { border-radius: 45% 55% 60% 40% / 6px 6px 6px 6px; transform: translateX(-50%) scaleX(0.97); }
          100% { border-radius: 40% 60% 55% 45% / 6px 6px 6px 6px; transform: translateX(-50%) scaleX(1); }
        }
        @keyframes plBrandIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes plPulse {
          0%, 100% { opacity: 0.3; }
          50%       { opacity: 0.6; }
        }
        @keyframes plMsgFade {
          0%   { opacity: 0; transform: translateY(5px); }
          15%  { opacity: 1; transform: translateY(0); }
          80%  { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-4px); }
        }
        @keyframes plRing {
          0%   { opacity: 0; transform: scale(0.4); }
          50%  { opacity: 0.5; }
          100% { opacity: 0; transform: scale(1.2); }
        }
        @keyframes plCorner {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .pl-liquid-fill {
          animation: plLiquidFill 1.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          animation-delay: 0.2s;
          clip-path: inset(100% 0 0 0);
        }
        .pl-wave-pos {
          animation: plWavePos 1.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          animation-delay: 0.2s;
          bottom: 0%;
        }
        .pl-wave-shape {
          animation: plWaveShape 0.9s ease-in-out infinite;
        }
        .pl-brand-in {
          animation: plBrandIn 0.6s ease forwards;
          animation-delay: 1.8s;
          opacity: 0;
        }
        .pl-pulse {
          animation: plPulse 1.8s ease-in-out infinite;
        }
      `}</style>

      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
        style={{
          backgroundImage: "url('/login-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          animation: phase === "out"
            ? "plOut 0.5s ease-in-out forwards"
            : "plIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        }}
      >
        {/* Geometric rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute rounded-full border border-foreground/[0.05]"
              style={{
                width: `${i * 200}px`,
                height: `${i * 200}px`,
                animation: `plRing ${1.4 + i * 0.5}s ease-out forwards`,
                animationDelay: `${i * 0.12}s`,
                opacity: 0,
              }}
            />
          ))}
        </div>

        {/* Corner accents */}
        <div className="absolute inset-0 pointer-events-none">
          {[
            { top: "10%", left: "8%", rotate: 0 },
            { top: "10%", right: "8%", rotate: 90 },
            { bottom: "10%", left: "8%", rotate: 270 },
            { bottom: "10%", right: "8%", rotate: 180 },
          ].map((pos, idx) => {
            const { rotate, ...position } = pos;
            return (
              <div
                key={idx}
                className="absolute w-10 h-10"
                style={{
                  ...position,
                  transform: `rotate(${rotate}deg)`,
                  animation: "plCorner 0.8s ease-out forwards",
                  animationDelay: `${0.2 + idx * 0.06}s`,
                  opacity: 0,
                }}
              >
                <div className="w-full h-px bg-foreground/20" />
                <div className="w-px h-full bg-foreground/20 absolute top-0 left-0" />
              </div>
            );
          })}
        </div>

        {/* Central content */}
        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Logo with liquid fill */}
          <div className="relative w-20 h-20">
            <div
              className="absolute inset-0 rounded-3xl pl-pulse"
              style={{
                background: "radial-gradient(circle, rgba(0,0,0,0.07) 0%, transparent 70%)",
                transform: "scale(1.6)",
              }}
            />
            {/* Ghost logo */}
            <img
              src={brandAsset("zei-logo.png")}
              alt=""
              aria-hidden
              className="absolute inset-0 w-full h-full object-contain"
              style={{ opacity: 0.12, filter: "grayscale(1)" }}
            />
            {/* Filling logo */}
            <img
              src={brandAsset("zei-logo.png")}
              alt="Zaheen.AI Logo"
              className="absolute inset-0 w-full h-full object-contain pl-liquid-fill"
            />
            {/* Wave at fill boundary */}
            <div
              className="absolute left-1/2 pl-wave-pos pointer-events-none"
              style={{ width: "120%", height: "10px" }}
            >
              <div
                className="pl-wave-shape w-full h-full"
                style={{
                  background: "rgba(255,255,255,0.32)",
                  position: "absolute",
                  left: 0,
                  top: "-4px",
                }}
              />
            </div>
          </div>

          {/* Brand — fades in after fill */}
          <div className="flex flex-col items-center gap-1 pl-brand-in">
            <h1 className="text-xl font-bold tracking-[0.35em] text-foreground uppercase">
              Zaheen Student.AI
            </h1>
            <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
              For Your Daily Education Guide
            </p>
          </div>

          {/* Progress bar + message */}
          <div className="flex flex-col items-center gap-3 pl-brand-in" style={{ animationDelay: "1.9s" }}>
            {/* Bar */}
            <div className="w-48 h-px bg-foreground/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-foreground/40 rounded-full"
                style={{
                  width: `${progress}%`,
                  transition: "width 0.18s ease-out",
                }}
              />
            </div>

            {/* Message */}
            <p
              key={currentMessage}
              className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground"
              style={{ animation: "plMsgFade 0.62s ease forwards" }}
            >
              {currentMessage}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
