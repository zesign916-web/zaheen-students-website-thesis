import { useEffect, useState } from "react";

export function TypeOnceText({
  text,
  delay = 0,
  className,
}: {
  text: string;
  delay?: number;
  className?: string;
}) {
  const [visibleLength, setVisibleLength] = useState(0);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer = 0;
    let index = 0;
    let cancelled = false;

    const showAll = () => {
      window.clearTimeout(timer);
      setVisibleLength(text.length);
    };

    if (preference.matches) {
      showAll();
      return;
    }

    const typeNext = () => {
      if (cancelled) return;
      index += 1;
      setVisibleLength(index);
      if (index < text.length) timer = window.setTimeout(typeNext, 22);
    };

    timer = window.setTimeout(typeNext, delay);
    preference.addEventListener("change", showAll);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      preference.removeEventListener("change", showAll);
    };
  }, [delay, text]);

  return (
    <span className={`type-once ${className ?? ""}`}>
      <span className="type-once-space" aria-hidden="true">{text}</span>
      <span className="type-once-visible" aria-hidden="true">{text.slice(0, visibleLength)}</span>
      <span className="sr-only">{text}</span>
    </span>
  );
}
