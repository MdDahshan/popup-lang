# إصلاح فترة الـ Popup (Reminder Interval)

## 🐛 المشكلة
عند تغيير فترة الـ popup من Settings (مثلاً 30 دقيقة)، كان التطبيق يستمر في إظهار الـ popup كل دقيقة واحدة.

## ✅ الحل

### المشكلة الأساسية:
الكود القديم كان يستخدم `tokio::time::interval` الذي يعمل بفترة ثابتة. حتى لو قرأنا الإعداد من قاعدة البيانات، الـ interval نفسه لا يتغير.

### الحل الجديد:
استخدام `tokio::time::sleep` بدلاً من `interval`، وقراءة الإعداد في كل مرة قبل الانتظار.

## 🔧 التحديث في `src-tauri/src/lib.rs`

### قبل:
```rust
// ❌ فترة ثابتة - لا تتغير
let mut interval = tokio::time::interval(Duration::from_secs(60));
loop {
    interval.tick().await;
    // قراءة الإعداد (لكن لا يُستخدم!)
    let interval_minutes = get_setting();
    show_popup();
}
```

### بعد:
```rust
// ✅ قراءة الإعداد في كل مرة
loop {
    // قراءة الفترة من قاعدة البيانات
    let interval_minutes = {
        let state = app_handle.state::<Database>();
        let db = state.conn.lock().unwrap();
        db.query_row(
            "SELECT value FROM app_settings WHERE key = 'reminder_interval'",
            [],
            |row| {
                let val: String = row.get(0)?;
                Ok(val.parse::<u64>().unwrap_or(1))
            }
        ).unwrap_or(1)
    };
    
    // تحويل الدقائق إلى ثواني
    let interval_seconds = interval_minutes * 60;
    
    println!("[Background] Next popup in {} minutes", interval_minutes);
    
    // الانتظار للفترة المحددة
    tokio::time::sleep(Duration::from_secs(interval_seconds)).await;
    
    // إظهار الـ popup
    show_popup_window(app_handle.clone()).await;
}
```

## 🎯 كيف يعمل الآن

### 1. عند بدء التطبيق:
```
[Background] Starting popup reminder loop...
[Background] Next popup in 1 minutes (60 seconds)
⏰ انتظار 60 ثانية...
[Background] Showing popup now...
```

### 2. بعد تغيير الإعداد إلى 30 دقيقة:
```
[Background] Next popup in 30 minutes (1800 seconds)
⏰ انتظار 1800 ثانية (30 دقيقة)...
[Background] Showing popup now...
```

### 3. الدورة التالية:
```
[Background] Next popup in 30 minutes (1800 seconds)
⏰ انتظار 1800 ثانية...
```

## ⚙️ الإعدادات المتاحة في Settings

في صفحة Settings، يمكنك اختيار:

| الخيار | الفترة | الاستخدام |
|--------|--------|-----------|
| Every 1 Minute | دقيقة واحدة | للاختبار فقط |
| Every 30 Minutes | 30 دقيقة | مراجعة متكررة |
| Every 1 Hour | ساعة واحدة | مراجعة منتظمة |
| Every 2 Hours | ساعتان | مراجعة معتدلة |
| Every 4 Hours | 4 ساعات | مراجعة خفيفة |

## 📝 خطوات الاستخدام

### 1. تغيير الفترة:
1. افتح Settings
2. اختر "Popup Quiz Interval"
3. اختر الفترة المطلوبة (مثلاً 30 Minutes)
4. اضغط "Save Changes"

### 2. اختبار الإعداد:
- اضغط "Trigger Test Popup Now" لاختبار الـ popup فوراً
- أو انتظر الفترة المحددة

### 3. مراقبة السجلات:
في terminal، ستظهر رسائل مثل:
```
[Background] Next popup in 30 minutes (1800 seconds)
[Background] Showing popup now...
```

## 💡 ملاحظات مهمة

### ✅ يعمل تلقائياً:
- الإعداد يُقرأ في كل دورة
- لا حاجة لإعادة تشغيل التطبيق
- التغيير يُطبق في الدورة التالية

### ⏰ متى يُطبق التغيير:
إذا كان الـ popup ينتظر حالياً (مثلاً 30 دقيقة)، وغيرت الإعداد إلى دقيقة واحدة:
- الدورة الحالية ستكمل الـ 30 دقيقة
- الدورة التالية ستستخدم دقيقة واحدة

### 🔄 للتطبيق الفوري:
استخدم زر "Trigger Test Popup Now" لإظهار popup فوراً بدون انتظار.

## 🚀 للاختبار

### 1. اختبار سريع (دقيقة واحدة):
```bash
npm run tauri dev
```
1. افتح Settings
2. اختر "Every 1 Minute"
3. احفظ
4. انتظر دقيقة واحدة
5. ✅ يجب أن يظهر popup

### 2. اختبار 30 دقيقة:
1. افتح Settings
2. اختر "Every 30 Minutes"
3. احفظ
4. اضغط "Trigger Test Popup Now" للاختبار الفوري
5. انتظر 30 دقيقة
6. ✅ يجب أن يظهر popup بعد 30 دقيقة

## 🐛 Troubleshooting

### المشكلة: الـ popup لا يظهر
**الحل:**
1. تحقق من وجود كلمات يومية (Generate Today's Words)
2. تحقق من السجلات في terminal
3. استخدم "Trigger Test Popup Now"

### المشكلة: الفترة لا تتغير
**الحل:**
1. تأكد من حفظ الإعدادات (Save Changes)
2. انتظر حتى تنتهي الدورة الحالية
3. الدورة التالية ستستخدم الإعداد الجديد

### المشكلة: الـ popup يظهر كثيراً
**الحل:**
1. افتح Settings
2. اختر فترة أطول (Every 2 Hours مثلاً)
3. احفظ

## 📊 الإعدادات الموصى بها

| الاستخدام | الفترة الموصى بها |
|-----------|-------------------|
| تعلم مكثف | 30 دقيقة |
| تعلم منتظم | 1 ساعة |
| مراجعة خفيفة | 2-4 ساعات |
| اختبار | 1 دقيقة |

## ✨ تحسينات مستقبلية

- [ ] إضافة "وضع لا تزعج" (Do Not Disturb)
- [ ] جدولة الـ popup (مثلاً فقط من 9 صباحاً إلى 5 مساءً)
- [ ] تخطي الـ popup إذا كان المستخدم في وضع ملء الشاشة
- [ ] إحصائيات عن عدد الـ popups المعروضة يومياً
