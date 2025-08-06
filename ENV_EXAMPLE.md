# 🔧 Environment Variables

## 📋 רשימת משתני סביבה

### Firebase Configuration
צור קובץ `.env.local` בתיקיית הפרויקט:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Netlify Environment Variables
ב-Netlify Dashboard → Site settings → Environment variables:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## 🔒 אבטחה

### סיסמת מנהל
עדכן ב-`src/auth.js`:
```javascript
const ADMIN_PASSWORD = 'your_secure_password_here';
```

### טיפים לאבטחה:
1. **אל תשתף** את קובץ `.env.local`
2. **שנה סיסמה** - אל תשתמש בברירת מחדל
3. **הגבל גישה** - רק למשתמשים נחוצים
4. **נטר פעילות** - בדוק לוגים באופן קבוע

## 🚀 דיפלוי

### Development
```bash
# יצירת קובץ .env.local
cp .env.example .env.local

# עדכון הפרטים
nano .env.local
```

### Production (Netlify)
1. **לך ל-Netlify Dashboard**
2. **Site settings** → **Environment variables**
3. **הוסף כל משתנה** בנפרד
4. **לחץ "Save"**

## 🔍 בדיקה

### בדיקת משתנים
```javascript
// בדיקה בקוד
console.log('API Key:', import.meta.env.VITE_FIREBASE_API_KEY);
console.log('Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
```

### בדיקת חיבור
1. **פתח את האפליקציה**
2. **בדוק אינדיקטור חיבור** (ירוק/אדום)
3. **נסה לשלוח טופס**
4. **בדוק Console** לשגיאות 