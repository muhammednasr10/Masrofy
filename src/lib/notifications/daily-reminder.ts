import { formatLocalDate } from "@/lib/calendar/dates";

export type DailyReminderSettings = {
  enabled: boolean;
  todayTime: string;
  missedTime: string;
};

export type DailyReminderSent = {
  today: string | null;
  missed: string | null;
};

const SETTINGS_KEY = "masrofy-daily-reminder";
const SENT_KEY = "masrofy-daily-reminder-sent";

export const DEFAULT_DAILY_REMINDER: DailyReminderSettings = {
  enabled: true,
  todayTime: "21:00",
  missedTime: "09:00",
};

export function normalizeReminderTime(value: string, fallback: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());

  if (!match) {
    return fallback;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) {
    return fallback;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function loadDailyReminderSettings(): DailyReminderSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);

    if (!raw) {
      return DEFAULT_DAILY_REMINDER;
    }

    const parsed = JSON.parse(raw) as Partial<DailyReminderSettings>;

    return {
      enabled: parsed.enabled !== false,
      todayTime: normalizeReminderTime(parsed.todayTime ?? "", DEFAULT_DAILY_REMINDER.todayTime),
      missedTime: normalizeReminderTime(parsed.missedTime ?? "", DEFAULT_DAILY_REMINDER.missedTime),
    };
  } catch {
    return DEFAULT_DAILY_REMINDER;
  }
}

export function saveDailyReminderSettings(settings: DailyReminderSettings) {
  const next: DailyReminderSettings = {
    enabled: settings.enabled,
    todayTime: normalizeReminderTime(settings.todayTime, DEFAULT_DAILY_REMINDER.todayTime),
    missedTime: normalizeReminderTime(settings.missedTime, DEFAULT_DAILY_REMINDER.missedTime),
  };

  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  return next;
}

export function loadDailyReminderSent(): DailyReminderSent {
  try {
    const raw = localStorage.getItem(SENT_KEY);

    if (!raw) {
      return { today: null, missed: null };
    }

    const parsed = JSON.parse(raw) as Partial<DailyReminderSent>;
    return {
      today: parsed.today ?? null,
      missed: parsed.missed ?? null,
    };
  } catch {
    return { today: null, missed: null };
  }
}

export function saveDailyReminderSent(sent: DailyReminderSent) {
  localStorage.setItem(SENT_KEY, JSON.stringify(sent));
}

export function localDateKey(date: Date) {
  return formatLocalDate(date);
}

export function previousLocalDateKey(date: Date) {
  return formatLocalDate(new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1));
}

export function isReminderDue(now: Date, time: string, lastSentDate: string | null) {
  const today = localDateKey(now);

  if (lastSentDate === today) {
    return false;
  }

  const normalized = normalizeReminderTime(time, "00:00");
  const [hours, minutes] = normalized.split(":").map(Number);
  const scheduled = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);

  return now >= scheduled;
}
