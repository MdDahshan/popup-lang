# إصلاح الـ Popup التلقائي والكويز السريع

## 🐛 المشاكل التي تم حلها

### 1. الـ Popup لا يظهر تلقائياً كل دقيقة
**المشكلة:** الكود كان معلق (TODO) ولا يستدعي `show_popup_window` فعلياً

**الحل:**
- تفعيل الـ background loop في `src-tauri/src/lib.rs`
- استدعاء `show_popup_window` كل دقيقة تلقائياً
- إضافة انتظار 10 ثواني عند بدء التطبيق لإعطاء الوقت للتهيئة

### 2. الكويز يعرض كل الكلمات بدلاً من سؤال واحد
**المشكلة:** `generate_quiz` كان يولد أسئلة لكل الكلمات اليومية

**الحل:**
- إضافة parameter `single_question` لدالة `generate_quiz`
- عند `single_question = true`، يتم اختيار كلمة واحدة عشوائية فقط
- PopupQuizPage يستخدم `startQuiz(true)` لسؤال واحد
- HomePage يستخدم `startQuiz(false)` للكويز الكامل

## ✅ التحديثات المطبقة

### 1. Backend (Rust)

#### في `src-tauri/src/lib.rs`:
```rust
// Background loop يعمل الآن فعلياً
tauri::async_runtime::spawn(async move {
    // انتظار 10 ثواني للتهيئة
    tokio::time::sleep(Duration::from_secs(10)).await;
    
    // كل دقيقة
    let mut interval = tokio::time::interval(Duration::from_secs(60));
    loop {
        interval.tick().await;
        
        // إظهار الـ popup
        commands::window::show_popup_window(app_handle.clone()).await;
    }
});
```

#### في `src-tauri/src/commands/quiz.rs`:
```rust
#[tauri::command]
pub fn generate_quiz(
    db: State<Database>, 
    single_question: Option<bool>
) -> Result<Vec<QuizQuestion>, String> {
    let single_question = single_question.unwrap_or(false);
    
    // اختيار كلمة واحدة أو كل الكلمات
    let words_to_quiz = if single_question {
        daily_words.choose(&mut rng).into_iter().collect()
    } else {
        daily_words.iter().collect()
    };
    
    // توليد الأسئلة...
}
```

### 2. Frontend (TypeScript)

#### في `src/lib/tauri.ts`:
```typescript
export async function generateQuiz(
    singleQuestion: boolean = false
): Promise<QuizQuestion[]> {
    return invoke("generate_quiz", { singleQuestion });
}
```

#### في `src/store/quizStore.ts`:
```typescript
interface QuizState {
    startQuiz: (singleQuestion?: boolean) => Promise<void>;
}

startQuiz: async (singleQuestion: boolean = false) => {
    const questions = await api.generateQuiz(singleQuestion);
    // ...
}
```

#### في `src/pages/PopupQuizPage.tsx`:
```typescript
useEffect(() => {
    // سؤال واحد فقط للـ popup
    startQuiz(true).catch(console.error);
}, []);
```

#### في `src/pages/HomePage.tsx`:
```typescript
const handleStartQuiz = async () => {
    // كويز كامل من الـ home page
    await startQuiz(false);
};
```

## 🎯 كيف يعمل الآن

### الـ Popup التلقائي:
1. ✅ التطبيق يبدأ وينتظر 10 ثواني
2. ✅ كل دقيقة، يظهر popup تلقائياً
3. ✅ الـ popup يحتوي على سؤال واحد فقط
4. ✅ بعد الإجابة، يغلق الـ popup تلقائياً

### الكويز من HomePage:
1. ✅ المستخدم يضغط "Start Quiz"
2. ✅ يفتح modal بكل الكلمات اليومية
3. ✅ كويز كامل مع نتيجة في النهاية

## 📝 الملفات المعدلة

1. ✅ `src-tauri/src/lib.rs` - تفعيل background loop
2. ✅ `src-tauri/src/commands/quiz.rs` - إضافة single_question parameter
3. ✅ `src/lib/tauri.ts` - تحديث signature
4. ✅ `src/store/quizStore.ts` - دعم single question
5. ✅ `src/pages/PopupQuizPage.tsx` - استخدام single question

## 🚀 للاختبار

1. شغل التطبيق:
```bash
npm run tauri dev
```

2. انتظر 10 ثواني ثم دقيقة واحدة
3. ✅ يجب أن يظهر popup تلقائياً بسؤال واحد
4. أجب على السؤال
5. ✅ الـ popup يغلق بعد الإجابة
6. انتظر دقيقة أخرى
7. ✅ يظهر popup جديد بسؤال مختلف

## ⚙️ تخصيص الفترة الزمنية

حالياً الـ popup يظهر كل دقيقة. لتغيير الفترة:

### الطريقة 1: من الكود
في `src-tauri/src/lib.rs`:
```rust
// غير 60 إلى العدد المطلوب بالثواني
let mut interval = tokio::time::interval(Duration::from_secs(60));
```

### الطريقة 2: من قاعدة البيانات (مستقبلاً)
يمكن إضافة إعداد في Settings:
```sql
INSERT INTO app_settings (key, value) VALUES ('reminder_interval', '5');
```

## 💡 ملاحظات

- الـ popup يظهر فقط إذا كانت هناك كلمات يومية
- كل popup يحتوي على سؤال واحد عشوائي
- الأسئلة تتنوع بين: translate, multiple_choice, fill_blank
- الـ popup يغلق تلقائياً بعد الإجابة
- يمكن إغلاق الـ popup بالضغط على X أو ESC

## 🎨 تحسينات مستقبلية

- [ ] إضافة إعداد في Settings لتخصيص الفترة الزمنية
- [ ] تتبع آخر مرة ظهر فيها الـ popup
- [ ] عدم إظهار الـ popup إذا كان المستخدم في وضع "لا تزعج"
- [ ] إحصائيات عن الأسئلة السريعة (popup) vs الكويز الكامل
