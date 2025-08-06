# 🚀 הגדרת Supabase למסד נתונים מאובטח

## למה Supabase?

- **PostgreSQL מלא** - מסד נתונים חזק ואמין
- **API אוטומטי** - REST ו-GraphQL אוטומטית
- **אימות מובנה** - מערכת הרשמה והתחברות
- **Real-time** - עדכונים בזמן אמת
- **חינמי** - עד 500MB ו-50,000 קריאות/חודש

## שלב 1: יצירת פרויקט Supabase

1. לך ל-[Supabase](https://supabase.com/)
2. לחץ על "Start your project"
3. התחבר עם GitHub או Google
4. לחץ על "New project"
5. תן שם לפרויקט (למשל: `secure-form-app`)
6. בחר סיסמה חזקה ל-Database
7. בחר Region (למשל: Europe West)
8. לחץ על "Create new project"

## שלב 2: יצירת טבלה

1. בפרויקט החדש, לך ל-"Table Editor"
2. לחץ על "New table"
3. תן שם: `form_submissions`
4. הוסף את העמודות הבאות:

```sql
-- יצירת טבלה
CREATE TABLE form_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(name) >= 2),
  age INTEGER NOT NULL CHECK (age >= 1 AND age <= 120),
  address TEXT NOT NULL CHECK (length(address) >= 5),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- יצירת מדיניות אבטחה
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- מדיניות: רק כתיבה מותרת, קריאה רק לאדמינים
CREATE POLICY "Allow insert for all" ON form_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read for admins only" ON form_submissions
  FOR SELECT USING (auth.role() = 'admin');
```

## שלב 3: התקנת Supabase Client

```bash
npm install @supabase/supabase-js
```

## שלב 4: הגדרת הקוד

צור קובץ `src/supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## שלב 5: עדכון הקומפוננטה

```javascript
import { supabase } from './supabase'

// בפונקציה handleSubmit:
const { data, error } = await supabase
  .from('form_submissions')
  .insert([
    {
      name: formData.name.trim(),
      age: parseInt(formData.age),
      address: formData.address.trim(),
      ip_address: 'client-ip',
      user_agent: navigator.userAgent
    }
  ])

if (error) {
  console.error('Error:', error)
  alert('שגיאה בשליחת הטופס. אנא נסה שוב.')
} else {
  console.log('Data inserted:', data)
  setIsSubmitted(true)
}
```

## שלב 6: הגדרות אבטחה מתקדמות

### 1. Rate Limiting עם Edge Functions

צור `supabase/functions/rate-limit/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { ip } = req.headers
  const { supabase } = await import('../_shared/supabase.ts')
  
  // בדיקת קצב בקשות
  const { count } = await supabase
    .from('form_submissions')
    .select('*', { count: 'exact', head: true })
    .gte('submitted_at', new Date(Date.now() - 60000).toISOString())
    .eq('ip_address', ip)
  
  if (count > 5) {
    return new Response(
      JSON.stringify({ error: 'Too many requests' }),
      { status: 429 }
    )
  }
  
  return new Response(JSON.stringify({ success: true }))
})
```

### 2. Validation נוספת

```sql
-- הוספת constraints נוספים
ALTER TABLE form_submissions 
ADD CONSTRAINT valid_hebrew_name 
CHECK (name ~ '^[א-ת\s]+$');

-- אינדקס לביצועים
CREATE INDEX idx_submitted_at ON form_submissions(submitted_at);
CREATE INDEX idx_ip_address ON form_submissions(ip_address);
```

## שלב 7: ניטור וניתוח

### 1. Dashboard מובנה
- **Table Editor**: ניהול נתונים
- **SQL Editor**: שאילתות מתקדמות
- **Logs**: מעקב אחר פעילות

### 2. Analytics
```sql
-- סטטיסטיקות יומיות
SELECT 
  DATE(submitted_at) as date,
  COUNT(*) as submissions,
  AVG(age) as avg_age
FROM form_submissions 
GROUP BY DATE(submitted_at)
ORDER BY date DESC;
```

## שלב 8: פרודקשן

### 1. Environment Variables
```bash
# .env.local
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Security Headers
```javascript
// vite.config.js
export default defineConfig({
  server: {
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  }
})
```

## 💰 עלויות Supabase

- **Free Tier**: 500MB, 50K requests/month
- **Pro**: $25/month - 8GB, 100K requests/month
- **Team**: $599/month - 100GB, 2M requests/month

## 🔒 יתרונות אבטחה

1. **Row Level Security** - אבטחה ברמת השורה
2. **Real-time subscriptions** - עדכונים בזמן אמת
3. **Built-in auth** - אימות מובנה
4. **Edge Functions** - פונקציות בצד השרת
5. **Database backups** - גיבויים אוטומטיים 