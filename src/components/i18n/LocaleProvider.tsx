"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "@/lib/router/navigation";
import {
  defaultLocale,
  getLocaleAttributes,
  isLocale,
  LOCALE_COOKIE,
  type Locale,
} from "@/i18n/config";
import arMessages from "@/i18n/messages/ar.json";
import enMessages from "@/i18n/messages/en.json";
import { createTranslator, getMessages, type Messages, type Translator } from "@/i18n/translate";

type LocaleContextValue = {
  locale: Locale;
  messages: Messages;
  t: Translator;
  setLocale: (locale: Locale, options?: { persistProfile?: boolean }) => Promise<void>;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function applyDocumentLocale(locale: Locale) {
  const { lang, dir } = getLocaleAttributes(locale);
  document.documentElement.lang = lang;
  document.documentElement.dir = dir;
}

function readLocaleCookie(): Locale {
  if (typeof document === "undefined") {
    return defaultLocale;
  }

  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  const value = match ? decodeURIComponent(match[1]) : null;
  return isLocale(value) ? value : defaultLocale;
}

export function LocaleProvider({
  initialLocale,
  initialMessages,
  children,
}: {
  initialLocale?: Locale;
  initialMessages?: Messages;
  children: ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(() => initialLocale ?? readLocaleCookie());
  const [messages, setMessages] = useState<Messages>(
    () => initialMessages ?? ((initialLocale ?? readLocaleCookie()) === "en" ? enMessages : arMessages),
  );

  useEffect(() => {
    applyDocumentLocale(locale);
  }, [locale]);

  const setLocale = useCallback(
    async (nextLocale: Locale, options?: { persistProfile?: boolean }) => {
      if (nextLocale === locale) {
        return;
      }

      const nextMessages = await getMessages(nextLocale);
      setLocaleState(nextLocale);
      setMessages(nextMessages);
      applyDocumentLocale(nextLocale);

      document.cookie = `${LOCALE_COOKIE}=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;

      if (options?.persistProfile) {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          await supabase.from("profiles").update({ locale: nextLocale }).eq("id", user.id);
        }
      }

      router.refresh();
    },
    [locale, router],
  );

  const value = useMemo(
    () => ({
      locale,
      messages,
      t: createTranslator(messages),
      setLocale,
    }),
    [locale, messages, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }

  return context;
}

export function useTranslations() {
  return useLocale().t;
}

export function useOptionalLocale() {
  return useContext(LocaleContext);
}

export function getFallbackLocaleContext(): LocaleContextValue {
  return {
    locale: defaultLocale,
    messages: arMessages,
    t: createTranslator(arMessages),
    setLocale: async () => undefined,
  };
}
