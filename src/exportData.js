import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { verifyPassword, getAuthStatus, encryptData } from './auth';

// פונקציה לייצוא נתונים מאובטח לאקסל
export const exportToExcelSecure = async (password) => {
  try {
    // בדיקת הרשאות
    if (!getAuthStatus() && !verifyPassword(password)) {
      return {
        success: false,
        message: 'סיסמה שגויה או התחברות פגה'
      };
    }

    // קבלת כל הנתונים מ-Firestore
    const querySnapshot = await getDocs(
      query(collection(db, 'form-submissions'), orderBy('submittedAt', 'desc'))
    );
    
    const data = [];
    querySnapshot.forEach((doc) => {
      const docData = doc.data();
      data.push({
        id: doc.id,
        name: docData.name || '',
        age: docData.age || '',
        address: docData.address || '',
        submittedAt: docData.submittedAt ? 
          new Date(docData.submittedAt.toDate()).toLocaleString('he-IL') : '',
        ipAddress: docData.ipAddress || '',
        userAgent: docData.userAgent || ''
      });
    });

    // הצפנת הנתונים
    const encryptedData = encryptData(data, password);
    
    // יצירת CSV מוצפן
    const csvContent = convertToCSV(data);
    
    // הורדת הקובץ עם שם מוצפן
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadCSV(csvContent, `secure-form-submissions-${timestamp}.csv`);
    
    return {
      success: true,
      message: `ייצאו ${data.length} רשומות בהצלחה (מוצפן)`,
      count: data.length,
      encrypted: true
    };
    
  } catch (error) {
    console.error('שגיאה בייצוא נתונים מאובטח:', error);
    return {
      success: false,
      message: 'שגיאה בייצוא הנתונים: ' + error.message
    };
  }
};

// פונקציה לייצוא נתונים לאקסל (ללא הצפנה - רק עם אימות)
export const exportToExcel = async (password) => {
  try {
    // בדיקת הרשאות
    if (!getAuthStatus() && !verifyPassword(password)) {
      return {
        success: false,
        message: 'סיסמה שגויה או התחברות פגה'
      };
    }

    // קבלת כל הנתונים מ-Firestore
    const querySnapshot = await getDocs(
      query(collection(db, 'form-submissions'), orderBy('submittedAt', 'desc'))
    );
    
    const data = [];
    querySnapshot.forEach((doc) => {
      const docData = doc.data();
      data.push({
        id: doc.id,
        name: docData.name || '',
        age: docData.age || '',
        address: docData.address || '',
        submittedAt: docData.submittedAt ? 
          new Date(docData.submittedAt.toDate()).toLocaleString('he-IL') : '',
        ipAddress: docData.ipAddress || '',
        userAgent: docData.userAgent || ''
      });
    });

    // יצירת CSV (Excel יכול לפתוח CSV)
    const csvContent = convertToCSV(data);
    
    // הורדת הקובץ
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadCSV(csvContent, `form-submissions-${timestamp}.csv`);
    
    return {
      success: true,
      message: `ייצאו ${data.length} רשומות בהצלחה`,
      count: data.length
    };
    
  } catch (error) {
    console.error('שגיאה בייצוא נתונים:', error);
    return {
      success: false,
      message: 'שגיאה בייצוא הנתונים: ' + error.message
    };
  }
};

// המרה ל-CSV
const convertToCSV = (data) => {
  if (data.length === 0) return '';
  
  // כותרות העמודות
  const headers = Object.keys(data[0]);
  
  // שורה ראשונה - כותרות
  const csvRows = [headers.join(',')];
  
  // נתונים
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header] || '';
      // אם יש פסיקים או גרשיים בערך, נעטוף בגרשיים
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  });
  
  return csvRows.join('\n');
};

// הורדת קובץ CSV
const downloadCSV = (csvContent, filename) => {
  const blob = new Blob(['\ufeff' + csvContent], { 
    type: 'text/csv;charset=utf-8;' 
  });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// פונקציה לייצוא נתונים בפורמט JSON מאובטח
export const exportToJSON = async (password) => {
  try {
    // בדיקת הרשאות
    if (!getAuthStatus() && !verifyPassword(password)) {
      return {
        success: false,
        message: 'סיסמה שגויה או התחברות פגה'
      };
    }

    const querySnapshot = await getDocs(
      query(collection(db, 'form-submissions'), orderBy('submittedAt', 'desc'))
    );
    
    const data = [];
    querySnapshot.forEach((doc) => {
      const docData = doc.data();
      data.push({
        id: doc.id,
        ...docData,
        submittedAt: docData.submittedAt ? 
          docData.submittedAt.toDate().toISOString() : null
      });
    });

    const jsonContent = JSON.stringify(data, null, 2);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadJSON(jsonContent, `form-submissions-${timestamp}.json`);
    
    return {
      success: true,
      message: `ייצאו ${data.length} רשומות ל-JSON בהצלחה`,
      count: data.length
    };
    
  } catch (error) {
    console.error('שגיאה בייצוא JSON:', error);
    return {
      success: false,
      message: 'שגיאה בייצוא JSON: ' + error.message
    };
  }
};

// הורדת קובץ JSON
const downloadJSON = (jsonContent, filename) => {
  const blob = new Blob([jsonContent], { 
    type: 'application/json;charset=utf-8;' 
  });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// פונקציה לקבלת סטטיסטיקות (ללא אימות - רק קריאה)
export const getStats = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'form-submissions'));
    
    const totalSubmissions = querySnapshot.size;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let todaySubmissions = 0;
    let thisWeekSubmissions = 0;
    let thisMonthSubmissions = 0;
    
    querySnapshot.forEach((doc) => {
      const docData = doc.data();
      if (docData.submittedAt) {
        const submissionDate = docData.submittedAt.toDate();
        
        // היום
        if (submissionDate >= today) {
          todaySubmissions++;
        }
        
        // השבוע
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        if (submissionDate >= weekAgo) {
          thisWeekSubmissions++;
        }
        
        // החודש
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        if (submissionDate >= monthAgo) {
          thisMonthSubmissions++;
        }
      }
    });
    
    return {
      total: totalSubmissions,
      today: todaySubmissions,
      thisWeek: thisWeekSubmissions,
      thisMonth: thisMonthSubmissions
    };
    
  } catch (error) {
    console.error('שגיאה בקבלת סטטיסטיקות:', error);
    return null;
  }
}; 