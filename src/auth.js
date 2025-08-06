// מערכת אימות לייצוא נתונים מאובטח

// סיסמה מוגדרת מראש (בפרודקשן כדאי להשתמש ב-environment variables)
const ADMIN_PASSWORD = 'admin123'; // שנה את זה לסיסמה חזקה יותר

// בדיקת סיסמה
export const verifyPassword = (password) => {
  return password === ADMIN_PASSWORD;
};

// שמירת מצב התחברות ב-localStorage
export const setAuthStatus = (isAuthenticated) => {
  localStorage.setItem('exportAuth', isAuthenticated ? 'true' : 'false');
  localStorage.setItem('authTimestamp', Date.now().toString());
};

// בדיקת מצב התחברות
export const getAuthStatus = () => {
  const isAuth = localStorage.getItem('exportAuth') === 'true';
  const timestamp = parseInt(localStorage.getItem('authTimestamp') || '0');
  const now = Date.now();
  
  // התחברות תקפה ל-30 דקות בלבד
  const isValid = isAuth && (now - timestamp) < 30 * 60 * 1000;
  
  if (!isValid) {
    setAuthStatus(false);
  }
  
  return isValid;
};

// יציאה מהמערכת
export const logout = () => {
  localStorage.removeItem('exportAuth');
  localStorage.removeItem('authTimestamp');
};

// הצפנת נתונים לפני ייצוא
export const encryptData = (data, password) => {
  // הצפנה פשוטה (בפרודקשן כדאי להשתמש בספריות הצפנה מתקדמות)
  const encrypted = btoa(JSON.stringify(data) + '|' + password);
  return encrypted;
};

// פענוח נתונים
export const decryptData = (encryptedData, password) => {
  try {
    const decoded = atob(encryptedData);
    const [data, storedPassword] = decoded.split('|');
    
    if (storedPassword !== password) {
      throw new Error('סיסמה שגויה');
    }
    
    return JSON.parse(data);
  } catch (error) {
    throw new Error('שגיאה בפענוח הנתונים');
  }
}; 