# إصلاح مشكلة Refresh Words

## 🐛 المشكلة
عند الضغط على "Refresh Words" أو "Generate a new set"، لا يحدث شيء لأن الكود كان يتحقق من وجود كلمات لليوم الحالي ويرجعها مباشرة بدلاً من توليد كلمات جديدة.

## ✅ الحل

### 1. تحديث Backend (Rust)

#### في `src-tauri/src/commands/ai.rs`:
- إضافة parameter `force_new: Option<bool>` للدالة `generate_daily_words`
- إذا كان `force_new = true`، يتم حذف الكلمات القديمة أولاً
- ثم توليد كلمات جديدة

```rust
#[tauri::command]
pub async fn generate_daily_words(
    db: State<'_, Database>, 
    force_new: Option<bool>
) -> Result<Vec<WordExplanation>, String> {
    let force_new = force_new.unwrap_or(false);
    
    if force_new {
        // حذف الكلمات القديمة
        queries::delete_daily_words_for_date(&conn, user.id, &today)?;
    }
    // ... توليد كلمات جديدة
}
```

#### في `src-tauri/src/db/queries.rs`:
- إضافة دالة جديدة `delete_daily_words_for_date`
- تحذف الكلمات اليومية والـ set الخاص باليوم

```rust
pub fn delete_daily_words_for_date(
    conn: &Connection, 
    user_id: i64, 
    date: &str
) -> Result<(), String> {
    // حذف daily_words
    // حذف daily_word_sets
}
```

### 2. تحديث Frontend (TypeScript)

#### في `src/lib/tauri.ts`:
```typescript
export async function generateDailyWords(
    forceNew: boolean = false
): Promise<WordExplanation[]> {
    return invoke("generate_daily_words", { forceNew });
}
```

#### في `src/store/wordsStore.ts`:
```typescript
interface WordsState {
    generateDailyWords: (forceNew?: boolean) => Promise<WordExplanation[]>;
}

generateDailyWords: async (forceNew: boolean = false) => {
    const words = await api.generateDailyWords(forceNew);
    // ...
}
```

#### في `src/pages/HomePage.tsx`:
```typescript
const handleGenerate = async () => {
    // إذا كانت هناك كلمات بالفعل، force new generation
    const forceNew = dailyWords.length > 0;
    await generateDailyWords(forceNew);
};
```

## 🎯 كيف يعمل الآن

### السيناريو 1: أول مرة في اليوم (لا توجد كلمات)
1. المستخدم يضغط "Generate Today's Words"
2. `forceNew = false` (لأن `dailyWords.length === 0`)
3. Backend يولد كلمات جديدة مباشرة
4. ✅ تظهر الكلمات

### السيناريو 2: توليد كلمات جديدة (توجد كلمات بالفعل)
1. المستخدم يضغط "Refresh Words"
2. `forceNew = true` (لأن `dailyWords.length > 0`)
3. Backend يحذف الكلمات القديمة أولاً
4. Backend يولد كلمات جديدة
5. ✅ تظهر الكلمات الجديدة

## 📝 الملفات المعدلة

1. ✅ `src-tauri/src/commands/ai.rs` - إضافة parameter force_new
2. ✅ `src-tauri/src/db/queries.rs` - إضافة دالة delete_daily_words_for_date
3. ✅ `src/lib/tauri.ts` - تحديث signature
4. ✅ `src/store/wordsStore.ts` - تحديث interface و implementation
5. ✅ `src/pages/HomePage.tsx` - إرسال forceNew = true عند الحاجة

## 🚀 للاختبار

1. شغل التطبيق:
```bash
npm run tauri dev
```

2. اضغط "Generate Today's Words" - يجب أن تظهر كلمات جديدة
3. اضغط "Refresh Words" - يجب أن تظهر كلمات مختلفة تماماً
4. ✅ يعمل بشكل صحيح!

## 💡 ملاحظات

- الكلمات القديمة يتم حذفها فقط عند الضغط على "Refresh Words"
- إذا فتحت التطبيق في نفس اليوم مرة أخرى، ستظهر نفس الكلمات (ما لم تضغط Refresh)
- هذا يحافظ على تقدم المستخدم في نفس اليوم
