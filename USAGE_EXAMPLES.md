# أمثلة استخدام المكونات الجديدة

## 1. استخدام MixedText Component

### مثال بسيط:
```tsx
import { MixedText } from "@/components/ui/mixed-text";

<MixedText 
  text="Hello World (مرحبا بالعالم)"
/>
```

**النتيجة:**
```
Hello World
مرحبا بالعالم
```

### مثال مع styling:
```tsx
<MixedText 
  text="The startup secured funding. (حصلت الشركة على تمويل.)"
  className="text-lg font-bold"
  lineClassName="mb-2 p-2 bg-gray-100 rounded"
/>
```

### مثال في الأزرار:
```tsx
<Button>
  <MixedText 
    text="Submit Answer (إرسال الإجابة)"
    className="flex-1"
  />
</Button>
```

## 2. استخدام RTL Utilities

### كشف اتجاه اللغة:
```tsx
import { getTextDirection, isRTL } from "@/lib/rtl";

const dir = getTextDirection('ar'); // 'rtl'
const isArabic = isRTL('ar'); // true
```

### كشف اتجاه النص:
```tsx
import { getContentDirection, containsRTL } from "@/lib/rtl";

const text = "Hello مرحبا";
const hasArabic = containsRTL(text); // true
const dir = getContentDirection(text); // 'rtl'
```

### فصل النصوص المختلطة:
```tsx
import { splitMixedText } from "@/lib/rtl";

const text = "English text (النص العربي)";
const parts = splitMixedText(text);
// [
//   { text: "English text", dir: "ltr" },
//   { text: "النص العربي", dir: "rtl" }
// ]
```

## 3. أمثلة من التطبيق

### في الأسئلة:
```tsx
// قبل:
<h3 dir={questionDir}>{question.prompt}</h3>

// بعد:
<MixedText 
  text={question.prompt}
  className="text-base font-semibold"
  lineClassName="block mb-1"
/>
```

### في الخيارات:
```tsx
// قبل:
<Button dir={optionDir}>
  <span>{option}</span>
</Button>

// بعد:
<Button>
  <MixedText 
    text={option}
    className="flex-1 text-left"
  />
</Button>
```

### في التغذية الراجعة:
```tsx
// قبل:
<p dir={nativeDir}>{feedback.explanation}</p>

// بعد:
<MixedText 
  text={feedback.explanation}
  className="text-sm leading-relaxed"
  lineClassName="block mb-1"
/>
```

## 4. CSS Classes المتاحة

### للنصوص المختلطة:
```css
.mixed-content-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.mixed-content-line {
  display: block;
  width: 100%;
}

.mixed-content-line[dir="rtl"] {
  text-align: right;
}

.mixed-content-line[dir="ltr"] {
  text-align: left;
}
```

### للعزل ثنائي الاتجاه:
```tsx
<span className="bidi-isolate" dir="rtl">
  النص العربي
</span>
```

### للنافذة المنبثقة:
```tsx
<div className="popup-quiz-container rounded-3xl">
  {/* المحتوى */}
</div>
```

## 5. أنماط الفصل المدعومة

### 1. الأقواس:
```
Input:  "English (العربية)"
Output: ["English", "العربية"]
```

### 2. النقاط:
```
Input:  "First sentence. الجملة الثانية."
Output: ["First sentence.", "الجملة الثانية."]
```

### 3. تلقائي:
```
Input:  "Mixed text نص مختلط"
Output: يتم تحديد الاتجاه تلقائياً
```

## 6. نصائح الاستخدام

### ✅ افعل:
- استخدم `MixedText` للنصوص التي قد تحتوي على لغات مختلطة
- استخدم `bidi-isolate` للنصوص القصيرة
- اختبر مع نصوص عربية وإنجليزية معاً

### ❌ لا تفعل:
- لا تستخدم `dir` مباشرة مع النصوص المختلطة
- لا تفترض أن كل النصوص من نفس الاتجاه
- لا تنسى إضافة `className` للتنسيق

## 7. اختبار سريع

```tsx
// اختبر المكون:
<div className="p-4 space-y-4">
  <MixedText text="Hello (مرحبا)" />
  <MixedText text="Good morning. صباح الخير." />
  <MixedText text="Welcome to the app (مرحباً بك في التطبيق)" />
</div>
```

## 8. Troubleshooting

### المشكلة: النصوص لا تزال متداخلة
**الحل:** تأكد من استخدام `MixedText` بدلاً من `<span>` أو `<p>` مباشرة

### المشكلة: الاتجاه غير صحيح
**الحل:** تحقق من أن النص يحتوي على أحرف عربية فعلية (ليس أرقام فقط)

### المشكلة: النافذة غير مدورة
**الحل:** تأكد من إضافة class `popup-quiz-container` و `rounded-3xl`
