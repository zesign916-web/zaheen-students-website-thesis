import { brandAsset } from "@/lib/brand-assets";

export function Preloader() {
  return (
    <>
      <style>{`
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
        @keyframes fadeInUp {
          0%   { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.7; }
        }
        .liquid-fill {
          animation: liquidFill 2.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          animation-delay: 0.3s;
          clip-path: inset(100% 0 0 0);
        }
        .wave-pos {
          animation: wavePos 2.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          animation-delay: 0.3s;
          bottom: 0%;
        }
        .wave-shape {
          animation: waveLine 0.9s ease-in-out infinite;
        }
        .brand-fadein {
          animation: fadeInUp 0.6s ease forwards;
          animation-delay: 2.2s;
          opacity: 0;
        }
        .pulse-glow {
          animation: pulseGlow 1.8s ease-in-out infinite;
        }
      `}</style>

      <div
        className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
        style={{
          backgroundImage: "url('/login-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Logo stack */}
        <div className="relative flex flex-col items-center gap-6">
          <div className="relative w-24 h-24">
            {/* Soft glow behind logo */}
            <div
              className="absolute inset-0 rounded-3xl pulse-glow"
              style={{
                background: "radial-gradient(circle, rgba(0,0,0,0.08) 0%, transparent 70%)",
                transform: "scale(1.6)",
              }}
            />

            {/* Ghost logo — always visible, dim */}
            <img
              src={brandAsset("zei-logo.png")}
              alt=""
              aria-hidden
              className="absolute inset-0 w-full h-full object-contain"
              style={{ opacity: 0.12, filter: "grayscale(1)" }}
            />

            {/* Filled logo — clips upward via liquidFill */}
            <img
              src={brandAsset("zei-logo.png")}
              alt="Zaheen.AI Logo"
              className="absolute inset-0 w-full h-full object-contain liquid-fill"
            />

            {/* Wave at the fill boundary */}
            <div
              className="absolute left-1/2 wave-pos pointer-events-none"
              style={{ width: "120%", height: "10px" }}
            >
              <div
                className="wave-shape w-full h-full"
                style={{
                  background: "rgba(255,255,255,0.35)",
                  position: "absolute",
                  left: 0,
                  top: "-4px",
                }}
              />
            </div>
          </div>

          {/* Brand name fades in after fill completes */}
          <div className="flex flex-col items-center gap-1 brand-fadein">
            <h1
              className="text-xl font-bold tracking-[0.3em] text-foreground uppercase"
              style={{ letterSpacing: "0.35em" }}
            >
              Zaheen Student.AI
            </h1>
            <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
              For Your Daily Education Guide
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
