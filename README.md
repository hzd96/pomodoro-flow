# Pomodoro Flow

تایمر پومودورو سریع، آفلاین و نصب‌شدنی (PWA) برای استفاده‌ی روزانه‌ی شخصی — ترکیب دو پروژه‌ی قبلی:

| از `pomodoro-flow` (PWA) | از `PomoFlow` (AI Planner) |
| --- | --- |
| کار آفلاین + نصب روی گوشی/دسکتاپ | برنامه‌ی جلسات با زمان شروع/پایان |
| تایمر آنالوگ / دیجیتال | تقسیم هدف به تسک با Gemini |
| Auto-start، صدا، نوتیفیکیشن | ۵ تم رنگی |
| ذخیره‌ی وضعیت و آمار | |

## استفاده‌ی روزانه

- صفحه را باز کن و **Start** را بزن؛ برنامه‌ی پیش‌فرض (۸ × ۲۵ دقیقه) آماده است.
- زمان‌های برنامه زنده محاسبه می‌شوند (بر اساس «الان»)، پس فیلد ساعت شروع لازم نیست.
- برای هر جلسه‌ی Focus می‌توانی تسک بنویسی، یا با **Plan tasks with AI** هدفت را خودکار تقسیم کنی (فارسی هم جواب می‌دهد).
- وضعیت تایمر بعد از بستن/رفرش صفحه حفظ می‌شود و زمان دقیق ادامه پیدا می‌کند.
- میانبرها: `Space` شروع/توقف · `N` رد کردن · `R` ریست · `S` تنظیمات
- آمار: تعداد جلسات امروز، دقیقه‌ی تمرکز، streak روزانه و نمودار ۷ روز.
- از منوی مرورگر «Install / Add to Home Screen» بزن تا مثل اپ باز شود.

## دیپلوی رایگان روی Cloudflare Pages (یک بار)

1. در داشبورد Cloudflare: **Workers & Pages → Create → Pages → Connect to Git** و این ریپو را انتخاب کن.
2. تنظیمات build:
   - Framework preset: `None` (یا Vite)
   - Build command: `npm run build`
   - Build output directory: `dist`
3. (اختیاری، برای AI) در **Settings → Variables and Secrets** اضافه کن:
   - `GEMINI_API_KEY` — کلید رایگان از <https://aistudio.google.com/apikey> (به‌صورت Secret)
   - `ACCESS_KEY` — یک رمز دلخواه تا فقط خودت از AI استفاده کنی؛ اپ یک بار می‌پرسد و ذخیره می‌کند
   - `GEMINI_MODEL` — اختیاری، پیش‌فرض `gemini-2.5-flash`
4. Save and Deploy. از این به بعد هر push به `main` خودکار دیپلوی می‌شود.

بدون `GEMINI_API_KEY` همه‌چیز کار می‌کند و فقط دکمه‌ی AI مخفی می‌شود.
کلید Gemini فقط روی سرور (Pages Function در `functions/api/tasks.ts`) است و هرگز به مرورگر نمی‌رسد.

> برای قفل کردن کل سایت روی خودت: **Zero Trust → Access → Applications** (رایگان) و فقط ایمیل خودت را مجاز کن.

جایگزین بدون Git: `npm run deploy` (با `npx wrangler login` قبلش).

## توسعه‌ی محلی

```bash
npm install
npm run dev        # http://localhost:3000 (بدون AI)
npm run cf:dev     # build + Cloudflare Functions روی http://localhost:8788
```

برای AI در حالت محلی، فایل `.dev.vars` بساز (در git نمی‌رود):

```
GEMINI_API_KEY=...
ACCESS_KEY=...
```

## ساختار

```
src/                React + TypeScript + Tailwind
  usePomodoro.ts    منطق تایمر (بر اساس timestamp، بدون drift)
  components/       Timer، Schedule، AiPlanner، Stats، SettingsDialog
functions/api/      Cloudflare Pages Function برای Gemini
public/             manifest، service worker، آیکن‌ها، _headers
```

تاریخچه‌ی git هر دو ریپوی قبلی در این ریپو merge شده است.
