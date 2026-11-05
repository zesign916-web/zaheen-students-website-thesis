import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export interface ContextMenuItem {
  label: string;
  icon?: React.ElementType;
  onClick: () => void;
  variant?: "default" | "danger";
  separator?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  useEffect(() => {
    if (!menuRef.current) return;
    const menu = menuRef.current;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const rect = menu.getBoundingClientRect();
    if (x + rect.width > vw) menu.style.left = `${vw - rect.width - 8}px`;
    if (y + rect.height > vh) menu.style.top = `${vh - rect.height - 8}px`;
  }, [x, y]);

  return createPortal(
    <div
      ref={menuRef}
      style={{ left: x, top: y }}
      className="fixed z-[9999] min-w-[180px] bg-card border border-border/70 rounded-2xl shadow-xl py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item, i) => {
        if (item.separator) {
          return <div key={i} className="my-1 border-t border-border/50 mx-2" />;
        }
        const Icon = item.icon;
        return (
          <button
            key={i}
            onClick={() => { item.onClick(); onClose(); }}
            className={cn(
              "w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors text-left",
              item.variant === "danger"
                ? "text-destructive hover:bg-destructive/10"
                : "text-foreground/80 hover:bg-muted/70 hover:text-foreground",
            )}
          >
            {Icon && <Icon className="w-3.5 h-3.5 shrink-0 opacity-70" />}
            {item.label}
          </button>
        );
      })}
    </div>,
    document.body,
  );
}
