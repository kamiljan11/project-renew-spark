// Kontekst i hook jezyka — poza plikiem komponentu (react-refresh).
import { createContext, useContext } from "react";
import type { Lang } from "./translations";

export type LangCtx = { lang: Lang; setLang: (l: Lang) => void; t: (key: string) => string };

export const LanguageContext = createContext<LangCtx | undefined>(undefined);

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}
