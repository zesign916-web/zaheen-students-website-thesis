import { useEffect, useState } from "react";

export function TypewriterHeading({ text, typingDuration = 3600 }: { text: string; typingDuration?: number }) {
  const [visibleLength, setVisibleLength] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setVisibleLength(text.length);
      return;
    }
    let index = 0;
    let deleting = false;
    let pause = 0;
    const timer = window.setInterval(() => {
      if (pause > 0) {
        pause -= 1;
        return;
      }
      if (!deleting) {
        index = Math.min(text.length, index + 1);
        setVisibleLength(index);
        if (index === text.length) {
          deleting = true;
          pause = 14;
        }
      } else {
        index = Math.max(0, index - 1);
        setVisibleLength(index);
        if (index === 0) {
          deleting = false;
          pause = 3;
        }
      }
    }, Math.max(45, typingDuration / text.length));
    return () => window.clearInterval(timer);
  }, [reducedMotion, text, typingDuration]);

  return <>{text.slice(0, visibleLength)}{!reducedMotion && <span className="typewriter-cursor" aria-hidden="true" />}</>;
}
