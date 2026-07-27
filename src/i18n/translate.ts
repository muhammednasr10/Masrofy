import type { Locale } from "@/i18n/config";

export type Messages = typeof import("@/i18n/messages/ar.json");

type MessageParams = Record<string, string | number>;

function getMessageValue(messages: Messages, key: string): string | undefined {
  const parts = key.split(".");
  let current: unknown = messages;

  for (const part of parts) {
    if (!current || typeof current !== "object" || !(part in current)) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === "string" ? current : undefined;
}

function interpolate(template: string, params?: MessageParams) {
  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, token: string) => String(params[token] ?? `{${token}}`));
}

export function createTranslator(messages: Messages) {
  return function t(key: string, params?: MessageParams) {
    const value = getMessageValue(messages, key);
    return value ? interpolate(value, params) : key;
  };
}

export type Translator = ReturnType<typeof createTranslator>;

export async function getMessages(locale: Locale): Promise<Messages> {
  if (locale === "en") {
    return (await import("@/i18n/messages/en.json")).default;
  }

  return (await import("@/i18n/messages/ar.json")).default;
}
