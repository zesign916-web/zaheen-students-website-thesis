import { useEffect, useState } from "react";
import { BrandImage } from "@/components/brand-image";

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
    <div className={`site-preloader${leaving ? " is-leaving" : ""}`} role="status" aria-label="Loading Zaheen Student">
      <div className="preloader-mark-wrap">
        <BrandImage filename="zahin-logo.png" alt="Zaheen Student logo" className="preloader-mark" width={112} height={112} />
      </div>
      <span className="preloader-caption">A learning initiative for every student</span>
    </div>
  );
}
