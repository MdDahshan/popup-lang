# Popup Lang

تطبيق سطح مكتب لتعلّم اللغات بطريقة يومية ذكية عبر:
- كلمات يومية مولّدة بالذكاء الاصطناعي
- مراجعة سريعة داخل التطبيق
- نافذة Quiz منبثقة تعمل في الخلفية
- تتبّع تقدّمك وإحصائياتك
- مساعد دردشة تعليمي

> مبني باستخدام: **Tauri + Rust + React + TypeScript + Tailwind + SQLite**

---

## المزايا الأساسية

- **Onboarding** لاختيار:
  - اللغة الأم
  - اللغة المستهدفة
  - المستوى
  - عدد الكلمات اليومية
  - التذكيرات والاهتمامات
- **توليد كلمات يومية** مع شرح، ترجمة، نطق، وأمثلة.
- **Quiz Popup** يظهر دوريًا (أو يدويًا من System Tray).
- **مساعد دردشة** يشرح الكلمات ويعطي تدريبًا إضافيًا.
- **لوحة تحكم** لعرض الإنجاز اليومي، الدقة، والسجل.
- **دعم RTL/LTR** وتحسين عرض النصوص المختلطة (عربي/إنجليزي).

---

## المتطلبات

قبل التشغيل تأكّد من تثبيت:

1. **Node.js** (يفضّل 18+ أو 20+)
2. **npm**
3. **Rust** + Cargo
4. متطلبات Tauri الخاصة بنظامك (WebView/tooling)

راجع توثيق Tauri الرسمي للمتطلبات حسب نظام التشغيل:
https://tauri.app/start/prerequisites/

---

## التشغيل محليًا

### 1) تثبيت الحزم

```bash
npm install
```

### 2) تشغيل التطبيق (Desktop)

```bash
npm run tauri dev
```

### 3) تشغيل الواجهة فقط (Web Dev)

```bash
npm run dev
```

---

## البناء للإنتاج

```bash
npm run tauri build
```

> سيتم إنشاء حزم التطبيق من خلال إعدادات Tauri في `src-tauri/tauri.conf.json`.

---

## إعداد مفتاح API

- توليد الكلمات اليومية يعتمد على Groq.
- بعد تشغيل التطبيق، افتح **Settings** وأدخل مفتاح API.
- يتم حفظ المفتاح محليًا داخل إعدادات التطبيق (SQLite).

---

## أوامر npm المتاحة

- `npm run dev` — تشغيل Vite
- `npm run build` — بناء الواجهة (TypeScript + Vite)
- `npm run preview` — معاينة build
- `npm run tauri` — أوامر Tauri
- `npm run test` — تشغيل الاختبارات مرة واحدة (Vitest)
- `npm run test:watch` — وضع المراقبة
- `npm run test:ui` — واجهة Vitest

---

## هيكل المشروع (مختصر)

- `src/` — واجهة React (Views, Stores, Components)
- `src-tauri/` — Rust backend + أوامر Tauri + SQLite
- `src-tauri/src/commands/` — أوامر التطبيق (chat/quiz/words/settings...)
- `src-tauri/src/db/` — migrations والاستعلامات
- `src-tauri/src/services/` — تكاملات AI/Providers

---

## ملاحظات

- التطبيق يستخدم System Tray ويستمر بالخلفية.
- إغلاق النافذة يخفي التطبيق بدل الإنهاء الكامل.
- يمكن إظهار Quiz فورًا من قائمة الـ Tray عبر خيار **Quiz Now**.

---

## ملفات توثيق إضافية داخل المشروع

- `language-learning-desktop-app.md`
- `POPUP_IMPROVEMENTS.md`
- `MEMORY_AND_POPUP_FIX.md`
- `USAGE_EXAMPLES.md`

إذا أردت، أقدر أكتب نسخة README ثانية بالإنجليزية أو نسخة أكثر تقنية للمطورين (مع تفاصيل المعمارية وقاعدة البيانات).