import { useEffect, useState, type ReactNode } from "react";
import { TRANSLATIONS, type Lang } from "./translations";
import { LanguageContext } from "./useLang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("mas-lang") as Lang | null;
    if (stored && (stored === "en" || stored === "pl" || stored === "is")) {
      setLangState(stored);
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("mas-lang", l);
  };

  const t = (key: string) => TRANSLATIONS[lang][key] ?? TRANSLATIONS.en[key] ?? key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>
  );
}
