# Masrofy

نظام ويب بسيط لإدارة المصروفات الشخصية باللغة العربية.

## المميزات (MVP)

- تسجيل دخول وإنشاء حساب عبر Supabase Auth
- إضافة مصروفات ودخل
- إدارة فئات المصروفات
- لوحة تحكم بملخص شهري وتوزيع حسب الفئة

## Tech Stack

- Vite
- React 19 + React Router
- TypeScript
- Tailwind CSS
- Supabase (Auth + PostgreSQL + RLS)
- Sentry لمراقبة أخطاء الإنتاج

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

بناء نسخة الإنتاج وتشغيلها مع مسارات السيرفر:

```bash
npm run build
npm start
```

## النشر

`vercel.json` ينشر مجلد `dist` كواجهة ثابتة، ويبقي ثلاثة مسارات على دوال Vercel لأنها تحتاج مفاتيح سرية:

- `DELETE /api/account/delete`
- `POST /api/admin/notify-category-suggestion`
- `GET /api/cron/due-notifications` يوميًا الساعة 05:00 UTC

فعّل `CRON_SECRET` في بيئة الإنتاج حتى يقبل الكرون الطلب.

## هيكل المشروع

```text
src/                 # واجهة React
  app/               # صفحات الشاشات
  components/
  lib/
server/              # منطق المسارات السرية
api/                 # دوال Vercel لنفس المسارات
supabase/migrations/
```

## GitHub

Repository: https://github.com/muhammednasr10/Masrofy
