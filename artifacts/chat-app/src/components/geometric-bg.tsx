import { useEffect, useRef } from "react";

export function GeometricBackground({ opacity = 1 }: { opacity?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);

  return (
    <>
      <style>{`
        @keyframes geoFloat1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33%       { transform: translate(6px, -10px) scale(1.015); }
          66%       { transform: translate(-4px, 5px) scale(0.985); }
        }
        @keyframes geoFloat2 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          40%       { transform: translate(-8px, 6px) scale(1.02); }
          70%       { transform: translate(5px, -8px) scale(0.98); }
        }
        @keyframes geoFloat3 {
          0%, 100% { transform: translate(0px, 0px) rotate(0deg); }
          50%       { transform: translate(4px, -6px) rotate(2deg); }
        }
        @keyframes geoFloat4 {
          0%, 100% { transform: translate(0px, 0px) rotate(0deg); }
          50%       { transform: translate(-6px, 4px) rotate(-2deg); }
        }
        @keyframes geoPulse {
          0%, 100% { opacity: var(--geo-base-op); }
          50%       { opacity: calc(var(--geo-base-op) * 1.6); }
        }

        .geo-f1 { animation: geoFloat1 18s ease-in-out infinite; }
        .geo-f2 { animation: geoFloat2 22s ease-in-out infinite; }
        .geo-f3 { animation: geoFloat3 15s ease-in-out infinite; }
        .geo-f4 { animation: geoFloat4 26s ease-in-out infinite; }
        .geo-f1b { animation: geoFloat1 20s ease-in-out infinite reverse; }
        .geo-f2b { animation: geoFloat2 17s ease-in-out infinite reverse; }
        .geo-f3b { animation: geoFloat3 24s ease-in-out infinite reverse; }
        .geo-pulse { animation: geoPulse 8s ease-in-out infinite; }
        .geo-pulse2 { animation: geoPulse 12s ease-in-out infinite 3s; }
        .geo-pulse3 { animation: geoPulse 10s ease-in-out infinite 6s; }
      `}</style>

      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: opacity * 0.55 }}
      >
        {/* ── Bottom-left cluster ── */}
        <g className="geo-f1">
          <polygon points="0,900 280,900 0,620"       fill="hsl(30,10%,72%)" fillOpacity="0.22" />
          <polygon points="0,620 280,900 340,580"      fill="hsl(30,8%,78%)"  fillOpacity="0.16" />
        </g>
        <g className="geo-f2 geo-pulse">
          <polygon points="280,900 520,900 340,700"    fill="hsl(30,10%,75%)" fillOpacity="0.18" />
          <polygon points="340,580 340,700 520,900 480,560" fill="hsl(30,8%,82%)"  fillOpacity="0.12" />
        </g>

        {/* ── Bottom-right cluster ── */}
        <g className="geo-f1b">
          <polygon points="1440,900 1160,900 1440,640" fill="hsl(30,10%,70%)" fillOpacity="0.20" />
          <polygon points="1440,640 1160,900 1090,660" fill="hsl(30,8%,76%)"  fillOpacity="0.15" />
        </g>
        <g className="geo-f2b geo-pulse2">
          <polygon points="1160,900 920,900 1090,720"  fill="hsl(30,10%,74%)" fillOpacity="0.16" />
          <polygon points="1090,660 1090,720 920,900 950,630" fill="hsl(30,8%,80%)"  fillOpacity="0.11" />
        </g>

        {/* ── Top-left cluster ── */}
        <g className="geo-f3">
          <polygon points="0,0 260,0 0,220"            fill="hsl(30,8%,76%)"  fillOpacity="0.17" />
          <polygon points="0,220 260,0 300,240"        fill="hsl(30,10%,72%)" fillOpacity="0.13" />
        </g>
        <g className="geo-f4 geo-pulse">
          <polygon points="260,0 500,0 300,200"        fill="hsl(30,8%,80%)"  fillOpacity="0.12" />
        </g>

        {/* ── Top-right cluster ── */}
        <g className="geo-f3b">
          <polygon points="1440,0 1180,0 1440,200"     fill="hsl(30,10%,74%)" fillOpacity="0.19" />
          <polygon points="1440,200 1180,0 1140,220"   fill="hsl(30,8%,78%)"  fillOpacity="0.14" />
        </g>
        <g className="geo-f1 geo-pulse3">
          <polygon points="1180,0 940,0 1140,180"      fill="hsl(30,10%,72%)" fillOpacity="0.15" />
          <polygon points="1140,220 940,180 940,0 1140,180" fill="hsl(30,8%,84%)"  fillOpacity="0.09" />
        </g>

        {/* ── Mid-edge accents ── */}
        <g className="geo-f2 geo-pulse2">
          <polygon points="0,480 180,380 200,540"      fill="hsl(30,8%,76%)"  fillOpacity="0.12" />
          <polygon points="0,540 200,540 160,680"      fill="hsl(30,10%,79%)" fillOpacity="0.10" />
        </g>
        <g className="geo-f4 geo-pulse3">
          <polygon points="1440,380 1260,420 1300,300" fill="hsl(30,8%,74%)"  fillOpacity="0.12" />
          <polygon points="1440,380 1440,540 1280,500" fill="hsl(30,10%,77%)" fillOpacity="0.10" />
        </g>

        {/* ── Scattered center — ultra-subtle ── */}
        <g className="geo-f3 geo-pulse">
          <polygon points="580,120 740,80 660,220"     fill="hsl(30,8%,78%)"  fillOpacity="0.08" />
        </g>
        <g className="geo-f1b geo-pulse2">
          <polygon points="820,760 960,800 880,680"    fill="hsl(30,10%,74%)" fillOpacity="0.08" />
        </g>
        <g className="geo-f2b">
          <polygon points="440,400 560,360 500,480"    fill="hsl(30,8%,80%)"  fillOpacity="0.07" />
          <polygon points="1000,320 1100,280 1060,400" fill="hsl(30,8%,78%)"  fillOpacity="0.07" />
        </g>

        {/* ── Animated squares/rects ── */}
        <g className="geo-f3 geo-pulse3">
          <rect x="600" y="700" width="90" height="90"
                transform="rotate(15 645 745)"
                fill="hsl(30,8%,76%)" fillOpacity="0.08" />
        </g>
        <g className="geo-f4 geo-pulse">
          <rect x="820" y="50" width="70" height="70"
                transform="rotate(-10 855 85)"
                fill="hsl(30,10%,73%)" fillOpacity="0.09" />
        </g>
        <g className="geo-f1b geo-pulse2">
          <rect x="1300" y="480" width="80" height="80"
                transform="rotate(20 1340 520)"
                fill="hsl(30,8%,75%)" fillOpacity="0.08" />
        </g>
        <g className="geo-f2 geo-pulse">
          <rect x="80" y="350" width="60" height="60"
                transform="rotate(-15 110 380)"
                fill="hsl(30,10%,74%)" fillOpacity="0.08" />
        </g>
      </svg>
    </>
  );
}
