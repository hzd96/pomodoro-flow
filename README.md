# Pomodoro Flow

تایمر پومودورو سریع، آفلاین و نصب‌شدنی (PWA) برای استفاده‌ی روزانه‌ی شخصی — ترکیب دو پروژه‌ی قبلی:

| از `pomodoro-flow` (PWA) | از `PomoFlow` |
| --- | --- |
| کار آفلاین + نصب روی گوشی/دسکتاپ | برنامه‌ی جلسات با زمان شروع/پایان |
| تایمر آنالوگ / دیجیتال | تسک برای هر جلسه |
| Auto-start، صدا، نوتیفیکیشن | ۵ تم رنگی |
| ذخیره‌ی وضعیت و آمار | |

## استفاده‌ی روزانه

- صفحه را باز کن و **Start** را بزن؛ برنامه‌ی پیش‌فرض (۸ × ۲۵ دقیقه) آماده است.
- زمان‌های برنامه زنده محاسبه می‌شوند (بر اساس «الان»)، پس فیلد ساعت شروع لازم نیست.
- برای هر جلسه‌ی Focus می‌توانی تسک بنویسی.
- وضعیت تایمر بعد از بستن/رفرش صفحه حفظ می‌شود و زمان دقیق ادامه پیدا می‌کند.
- میانبرها: `Space` شروع/توقف · `N` رد کردن · `R` ریست · `S` تنظیمات
- آمار: تعداد جلسات امروز، دقیقه‌ی تمرکز، streak روزانه و نمودار ۷ روز.
- از منوی مرورگر «Install / Add to Home Screen» بزن تا مثل اپ باز شود.

## دیپلوی رایگان روی Cloudflare Pages (یک بار)

**سریع‌ترین راه (بدون Git):** `npm run build` بزن (یا zip آماده‌ی `dist` را بگیر) → Workers & Pages → Create → Pages → **Upload assets** → zip را بکش و رها کن → Deploy.

**با Git (دیپلوی خودکار با هر push):**

1. در داشبورد Cloudflare: **Workers & Pages → Create → Pages → Connect to Git** و این ریپو را انتخاب کن.
2. تنظیمات build:
   - Framework preset: `None` (یا Vite)
   - Build command: `npm run build`
   - Build output directory: `dist`
3. Save and Deploy. از این به بعد هر push به `main` خودکار دیپلوی می‌شود.

> برای قفل کردن کل سایت روی خودت: **Zero Trust → Access → Applications** (رایگان) و فقط ایمیل خودت را مجاز کن.

جایگزین بدون Git: `npm run deploy` (با `npx wrangler login` قبلش).

## توسعه‌ی محلی

```bash
npm install
npm run dev        # http://localhost:3000
```

## ساختار

```
src/                React + TypeScript + Tailwind
  usePomodoro.ts    منطق تایمر (بر اساس timestamp، بدون drift)
  components/       Timer، Schedule، Stats، SettingsDialog
public/             manifest، service worker، آیکن‌ها، _headers
```

تاریخچه‌ی git هر دو ریپوی قبلی در این ریپو merge شده است.
