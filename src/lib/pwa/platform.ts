import {
  PWA_INSTALL_DISMISS_DAYS,
  PWA_INSTALL_DISMISS_KEY,
} from "@/lib/pwa/constants";

export function isStandalonePwa() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

export function isIosSafari() {
  if (typeof window === "undefined") {
    return false;
  }

  const userAgent = window.navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(userAgent);

  return isIos && isSafari;
}

export function isAndroidChromium() {
  if (typeof window === "undefined") {
    return false;
  }

  const userAgent = window.navigator.userAgent;
  const isAndroid = /Android/i.test(userAgent);
  const isChromium =
    /Chrome|EdgA|SamsungBrowser/i.test(userAgent) && !/Firefox|Opera|OPR|UCBrowser/i.test(userAgent);

  return isAndroid && isChromium;
}

export function isMobileInstallBrowser() {
  return isIosSafari() || isAndroidChromium();
}

export function wasInstallPromptDismissedRecently() {
  if (typeof window === "undefined") {
    return true;
  }

  const rawValue = window.localStorage.getItem(PWA_INSTALL_DISMISS_KEY);

  if (!rawValue) {
    return false;
  }

  const dismissedAt = Number(rawValue);

  if (!Number.isFinite(dismissedAt)) {
    return false;
  }

  const dismissMs = PWA_INSTALL_DISMISS_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - dismissedAt < dismissMs;
}

export function markInstallPromptDismissed() {
  window.localStorage.setItem(PWA_INSTALL_DISMISS_KEY, String(Date.now()));
}

export function clearInstallPromptDismissal() {
  window.localStorage.removeItem(PWA_INSTALL_DISMISS_KEY);
}
