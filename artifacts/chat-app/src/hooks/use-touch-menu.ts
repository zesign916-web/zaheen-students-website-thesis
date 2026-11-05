import { useRef, useCallback } from "react";

interface TouchMenuOptions {
  onOpen: (x: number, y: number) => void;
}

export function useTouchMenu({ onOpen }: TouchMenuOptions) {
  const lastTapRef = useRef<number>(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;

    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      e.preventDefault();
      onOpen(x, y);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }, [onOpen]);

  const onTouchMove = useCallback(() => {
    lastTapRef.current = 0;
  }, []);

  return { onTouchStart, onTouchMove };
}
