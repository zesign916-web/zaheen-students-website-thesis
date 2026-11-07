import { useEffect, useState } from "react";

export function WebsitePreloader({ onComplete }: { onComplete: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLeaving(true);
      window.setTimeout(onComplete, 550);
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`site-preloader${leaving ? " is-leaving" : ""}`} role="status" aria-label="Loading ZahinStudent">
      <div className="preloader-light" />
      <div className="preloader-mark-wrap">
        <span className="preloader-halo" />
        <img src="/zei-logo.png" alt="ZahinStudent" className="preloader-mark" />
      </div>
      <span className="preloader-caption">A learning initiative for every student</span>
    </div>
  );
}
