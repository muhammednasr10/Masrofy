# Masrofy

نظام ويب بسيط لإدارة المصروفات الشخصية باللغة العربية.

## المميزات (MVP)

- تسجيل دخول وإنشاء حساب عبر Supabase Auth
- إضافة مصروفات ودخل
- إدارة فئات المصروفات
- لوحة تحكم بملخص شهري وتوزيع حسب الفئة

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Auth + PostgreSQL + RLS)

## البداية السريعة

### 1) إنشاء مشروع Supabase جديد

> مهم: استخدم مشروع Supabase جديد خاص بـ Masrofy. لا تستخدم مشروع إنتاج آخر.

1. أنشئ مشروعًا جديدًا من [Supabase Dashboard](https://supabase.com/dashboard)
2. من **SQL Editor**، نفّذ محتوى الملف:
   `supabase/migrations/001_init.sql`
3. من **Authentication > Providers**، فعّل Email
4. من **Project Settings > API**، انسخ:
   - Project URL
   - anon public key

### 2) إعداد المتغيرات

```bash
cp .env.example .env.local
```

املأ القيم:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 3) تشغيل المشروع

```bash
npm install
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000)

## هيكل المشروع

```text
src/
  app/
    (app)/          # الصفحات المحمية
    (auth)/         # login / register
    auth/callback/  # Supabase auth callback
  components/
  lib/
    supabase/
    types/
    utils/
supabase/
  migrations/
```

## GitHub

Repository: https://github.com/muhammednasr10/Masrofy

## الخطوات القادمة المقترحة

- ميزانيات شهرية لكل فئة
- تصدير CSV / PDF
- PWA للموبايل
- رسوم بيانية أسبوعية
- دعم عملات متعددة
