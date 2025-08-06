# 🔥 הגדרת Firebase למסד נתונים מאובטח

## שלב 1: יצירת פרויקט Firebase

1. לך ל-[Firebase Console](https://console.firebase.google.com/)
2. לחץ על "Create a project" או "צור פרויקט"
3. תן שם לפרויקט (למשל: `my-secure-form-app`)
4. בחר אם להפעיל Google Analytics (אופציונלי)
5. לחץ על "Create project"

## שלב 2: הוספת אפליקציית Web

1. בפרויקט החדש, לחץ על סמל ה-Web (</>) 
2. תן שם לאפליקציה (למשל: `secure-form-web`)
3. לחץ על "Register app"
4. העתק את פרטי ההגדרה (firebaseConfig)

## שלב 3: הגדרת Firestore Database

1. בתפריט הצד, לחץ על "Firestore Database"
2. לחץ על "Create database"
3. בחר "Start in test mode" (לפיתוח)
4. בחר מיקום (למשל: europe-west1)

## שלב 4: עדכון הקוד

1. פתח את הקובץ `src/firebase.js`
2. החלף את הפרטים הבאים עם הפרטים שלך:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## שלב 5: הגדרות אבטחה (חשוב!)

### כללי Firestore:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /form-submissions/{document} {
      allow write: if true;  // לאפשר כתיבה לכולם (לפיתוח)
      allow read: if false;  // למנוע קריאה (לאדמינים בלבד)
    }
  }
}
```

### כללי אבטחה מתקדמים (לפרודקשן):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /form-submissions/{document} {
      allow write: if 
        request.resource.data.name is string &&
        request.resource.data.name.size() >= 2 &&
        request.resource.data.age is number &&
        request.resource.data.age >= 1 &&
        request.resource.data.age <= 120 &&
        request.resource.data.address is string &&
        request.resource.data.address.size() >= 5;
      allow read: if false;
    }
  }
}
```

## שלב 6: בדיקה

1. הרץ את האפליקציה: `npm run dev`
2. מלא את הטופס ולחץ "שלח טופס"
3. בדוק ב-Firebase Console שהנתונים נשמרו

## 🔒 אבטחה נוספת

### 1. Rate Limiting
הוסף הגבלת קצב כדי למנוע ספאם:
```javascript
// בקובץ firebase.js
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions(app);
export const submitFormWithRateLimit = httpsCallable(functions, 'submitForm');
```

### 2. Captcha
הוסף Google reCAPTCHA:
```bash
npm install react-google-recaptcha
```

### 3. Validation נוספת
הוסף validation בצד השרת עם Cloud Functions.

## 📊 ניטור וניתוח

1. **Firebase Analytics**: מעקב אחר שימוש
2. **Firebase Performance**: ביצועים
3. **Firebase Crashlytics**: שגיאות

## 💰 עלויות

- **Spark Plan (חינמי)**: עד 50,000 קריאות/חודש
- **Blaze Plan**: תשלום לפי שימוש

## 🚀 פרודקשן

1. שנה את כללי האבטחה
2. הוסף Rate Limiting
3. הוסף Captcha
4. הגדר Monitoring
5. בדוק Performance 