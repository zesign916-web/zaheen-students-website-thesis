import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type FontSize = "small" | "medium" | "large";
export type Theme = "light" | "dark";

interface AppearanceContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  fontSize: FontSize;
  setFontSize: (s: FontSize) => void;
}

const AppearanceContext = createContext<AppearanceContextType | null>(null);

const FONT_SIZE_MAP: Record<FontSize, string> = {
  small: "13px",
  medium: "15px",
  large: "17px",
};

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try { return (localStorage.getItem("zei_theme") as Theme) || "light"; }
    catch { return "light"; }
  });
  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    try { return (localStorage.getItem("zei_font_size") as FontSize) || "medium"; }
    catch { return "medium"; }
  });

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("zei_theme", t);
  };

  const setFontSize = (s: FontSize) => {
    setFontSizeState(s);
    localStorage.setItem("zei_font_size", s);
  };

  useEffect(() => {
    const root = document.documentElement;

    root.classList.remove("dark");

    if (theme === "dark") {
      root.classList.add("dark");
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.fontSize = FONT_SIZE_MAP[fontSize];
  }, [fontSize]);

  return (
    <AppearanceContext.Provider value={{ theme, setTheme, fontSize, setFontSize }}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const ctx = useContext(AppearanceContext);
  if (!ctx) throw new Error("useAppearance must be used within AppearanceProvider");
  return ctx;
}
