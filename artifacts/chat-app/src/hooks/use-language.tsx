import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { translations, type Language } from "@/lib/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
  isUrdu: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      return (localStorage.getItem("zehn-language") as Language) || "en";
    } catch {
      return "en";
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try { localStorage.setItem("zehn-language", lang); } catch {}
  };

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("dir", "ltr");
    if (language === "ur") {
      root.setAttribute("lang", "ur");
      root.classList.add("lang-ur");
    } else {
      root.setAttribute("lang", "en");
      root.classList.remove("lang-ur");
    }
  }, [language]);

  const t = translations[language] as typeof translations.en;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isUrdu: language === "ur" }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
