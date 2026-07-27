import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import PwaRegister from "@/components/pwa/PwaRegister";
import { getLocaleAttributes } from "@/i18n/config";
import { getMessages } from "@/i18n/translate";
import { getServerLocale } from "@/i18n/server";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "Masrofy | مصروفي",
  description: "نظام بسيط لإدارة المصروفات والدخل الشخصي",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "مصروفي",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#059669",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();
  const messages = await getMessages(locale);
  const { lang, dir } = getLocaleAttributes(locale);

  return (
    <html lang={lang} dir={dir} className={`${cairo.variable} h-full`}>
      <body className="min-h-full bg-slate-50 font-sans text-slate-900 antialiased">
        <LocaleProvider initialLocale={locale} initialMessages={messages}>
          <PwaRegister />
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
