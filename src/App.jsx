import { useState, useEffect, useRef } from 'react'
import { collection, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore'
import { db } from './firebase'
import { exportToExcel, exportToJSON, getStats } from './exportData'
import { verifyPassword, getAuthStatus, setAuthStatus, logout } from './auth'
import './App.css'

function App() {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    address: ''
  })
  const [errors, setErrors] = useState({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastSubmission, setLastSubmission] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [stats, setStats] = useState(null)
  const [showExportOptions, setShowExportOptions] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  
  // Electronic signature states
  const [signature, setSignature] = useState('')
  const [isDrawing, setIsDrawing] = useState(false)
  const [signatureError, setSignatureError] = useState('')
  const canvasRef = useRef(null)
  const contextRef = useRef(null)

  // Check Firebase connection
  useEffect(() => {
    try {
      // Test connection by listening to a collection
      const unsubscribe = onSnapshot(collection(db, 'form-submissions'), 
        () => {
          setIsConnected(true)
        },
        (error) => {
          console.error('Firebase connection error:', error)
          setIsConnected(false)
        }
      )
      
      return () => unsubscribe()
    } catch (error) {
      console.error('Firebase initialization error:', error)
      setIsConnected(false)
    }
  }, [])

  // Load statistics
  useEffect(() => {
    const loadStats = async () => {
      if (isConnected) {
        const statistics = await getStats()
        setStats(statistics)
      }
    }
    
    loadStats()
  }, [isConnected])

  // Check authentication status
  useEffect(() => {
    const authStatus = getAuthStatus()
    setIsAuthenticated(authStatus)
  }, [])

  // Initialize signature canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      canvas.width = canvas.offsetWidth * 2
      canvas.height = canvas.offsetHeight * 2
      canvas.style.width = `${canvas.offsetWidth}px`
      canvas.style.height = `${canvas.offsetHeight}px`
      
      const context = canvas.getContext('2d')
      context.scale(2, 2)
      context.lineCap = 'round'
      context.strokeStyle = '#000'
      context.lineWidth = 2
      contextRef.current = context
    }
  }, [])

  const startDrawing = (e) => {
    setIsDrawing(true)
    const { offsetX, offsetY } = e.nativeEvent
    contextRef.current.beginPath()
    contextRef.current.moveTo(offsetX, offsetY)
  }

  const draw = (e) => {
    if (!isDrawing) return
    const { offsetX, offsetY } = e.nativeEvent
    contextRef.current.lineTo(offsetX, offsetY)
    contextRef.current.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    const canvas = canvasRef.current
    if (canvas) {
      const signatureData = canvas.toDataURL()
      setSignature(signatureData)
      setSignatureError('')
    }
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const context = contextRef.current
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height)
      setSignature('')
      setSignatureError('')
    }
  }

  const validateForm = () => {
    const newErrors = {}

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'שם הוא שדה חובה'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'שם חייב להכיל לפחות 2 תווים'
    } else if (!/^[א-ת\s]+$/.test(formData.name.trim())) {
      newErrors.name = 'שם חייב להכיל רק אותיות בעברית'
    }

    // Validate age
    if (!formData.age.trim()) {
      newErrors.age = 'גיל הוא שדה חובה'
    } else if (isNaN(formData.age) || parseInt(formData.age) < 1 || parseInt(formData.age) > 120) {
      newErrors.age = 'גיל חייב להיות מספר בין 1 ל-120'
    }

    // Validate address
    if (!formData.address.trim()) {
      newErrors.address = 'כתובת היא שדה חובה'
    } else if (formData.address.trim().length < 5) {
      newErrors.address = 'כתובת חייב להכיל לפחות 5 תווים'
    }

    // Validate signature
    if (!signature) {
      newErrors.signature = 'חתימה אלקטרונית היא חובה'
      setSignatureError('חתימה אלקטרונית היא חובה')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (validateForm()) {
      // Rate limiting - מקסימום 5 שליחות בדקה
      const now = Date.now()
      if (now - lastSubmission < 60000) {
        alert('אנא המתן דקה לפני שליחה נוספת')
        return
      }
      
      setIsSubmitting(true)
      
      try {
        // Add document to Firestore
        const docRef = await addDoc(collection(db, 'form-submissions'), {
          name: formData.name.trim(),
          age: parseInt(formData.age),
          address: formData.address.trim(),
          signature: signature, // Add signature data
          signatureTimestamp: serverTimestamp(),
          submittedAt: serverTimestamp(),
          ipAddress: 'client-ip', // In production, get from server
          userAgent: navigator.userAgent
        })
        
        console.log('Document written with ID: ', docRef.id)
        setIsSubmitted(true)
        setLastSubmission(now)
        
        // Reset form after successful submission
        setTimeout(() => {
          setFormData({ name: '', age: '', address: '' })
          setSignature('')
          clearSignature()
          setIsSubmitted(false)
        }, 3000)
        
      } catch (error) {
        console.error('Error adding document: ', error)
        
        // Handle specific Firebase errors
        if (error.code === 'permission-denied') {
          alert('שגיאת הרשאות. אנא בדוק את הגדרות האבטחה ב-Firebase.')
        } else if (error.code === 'unavailable') {
          alert('שירות Firebase לא זמין כרגע. אנא נסה שוב מאוחר יותר.')
        } else if (error.code === 'quota-exceeded') {
          alert('חריגה ממגבלת השימוש החינמי. אנא שדרג ל-Blaze Plan.')
        } else {
          alert('שגיאה בשליחת הטופס: ' + error.message)
        }
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleReset = () => {
    setFormData({ name: '', age: '', address: '' })
    setErrors({})
    setSignature('')
    setSignatureError('')
    clearSignature()
    setIsSubmitted(false)
  }

  const handleExportToExcel = async () => {
    setIsExporting(true)
    try {
      const result = await exportToExcel()
      if (result.success) {
        alert(result.message)
      } else {
        alert('שגיאה בייצוא: ' + result.message)
      }
    } catch (error) {
      alert('שגיאה בייצוא: ' + error.message)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportToJSON = async () => {
    setIsExporting(true)
    try {
      const result = await exportToJSON(password)
      if (result.success) {
        alert(result.message)
      } else {
        alert('שגיאה בייצוא: ' + result.message)
      }
    } catch (error) {
      alert('שגיאה בייצוא: ' + error.message)
    } finally {
      setIsExporting(false)
    }
  }

  const handleLogin = () => {
    setLoginError('')
    if (verifyPassword(password)) {
      setAuthStatus(true)
      setIsAuthenticated(true)
      setShowLoginForm(false)
      setPassword('')
      alert('התחברת בהצלחה!')
    } else {
      setLoginError('סיסמה שגויה')
    }
  }

  const handleLogout = () => {
    logout()
    setIsAuthenticated(false)
    setShowExportOptions(false)
    alert('יציאה')
  }

  const handlePasswordChange = (e) => {
    setPassword(e.target.value)
    setLoginError('')
  }

  return (
    <div className="app">
      <div className="form-container">
        <h1 className="form-title">טופס מאובטח</h1>
        <p className="form-subtitle">אנא מלא את הפרטים הבאים</p>
        
        {/* Connection status indicator */}
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          <div className="status-dot"></div>
          <span>{isConnected ? 'מחובר למסד נתונים' : 'לא מחובר למסד נתונים'}</span>
        </div>
        
        {/* Statistics */}
        {stats && (
          <div className="statistics">
            <h3>סטטיסטיקות</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-number">{stats.total}</span>
                <span className="stat-label">סה"כ שליחות</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{stats.today}</span>
                <span className="stat-label">היום</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{stats.thisWeek}</span>
                <span className="stat-label">השבוע</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{stats.thisMonth}</span>
                <span className="stat-label">החודש</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Export Options */}
        {isConnected && (
          <div className="export-section">
            {!isAuthenticated ? (
              <div className="auth-section">
                <button 
                  className="login-btn"
                  onClick={() => setShowLoginForm(!showLoginForm)}
                >
                  התחבר לייצוא נתונים
                </button>
                
                {showLoginForm && (
                  <div className="login-form">
                    <div className="form-group">
                      <label htmlFor="password" className="form-label">
                        סיסמת מנהל
                      </label>
                      <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={handlePasswordChange}
                        className={`form-input ${loginError ? 'error' : ''}`}
                        placeholder="הכנס סיסמה"
                        onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                      />
                      {loginError && <span className="error-message">{loginError}</span>}
                    </div>
                    <div className="auth-actions">
                      <button 
                        className="login-submit-btn"
                        onClick={handleLogin}
                      >
                        התחבר
                      </button>
                      <button 
                        className="cancel-btn"
                        onClick={() => {
                          setShowLoginForm(false)
                          setPassword('')
                          setLoginError('')
                        }}
                      >
                        ביטול
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="auth-status">
                  <span className="auth-indicator">✓ מחובר</span>
                  <button 
                    className="logout-btn"
                    onClick={handleLogout}
                  >
                    יציאה
                  </button>
                </div>
                
                <button 
                  className="export-toggle-btn"
                  onClick={() => setShowExportOptions(!showExportOptions)}
                >
                  {showExportOptions ? 'הסתר' : 'ייצא נתונים'}
                </button>
                
                {showExportOptions && (
                  <div className="export-options">
                    <button 
                      className="export-btn excel-btn"
                      onClick={handleExportToExcel}
                      disabled={isExporting}
                    >
                      {isExporting ? 'מייצא...' : 'ייצא לאקסל (CSV)'}
                    </button>
                    <button 
                      className="export-btn json-btn"
                      onClick={handleExportToJSON}
                      disabled={isExporting}
                    >
                      {isExporting ? 'מייצא...' : 'ייצא ל-JSON'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        {isSubmitted ? (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h2>הטופס נשלח בהצלחה!</h2>
            <p>תודה על מילוי הטופס. הנתונים נשמרו באופן מאובטח.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="secure-form">
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                שם מלא *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`form-input ${errors.name ? 'error' : ''}`}
                placeholder="הכנס את שמך המלא"
                maxLength="50"
                disabled={isSubmitting}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="age" className="form-label">
                גיל *
              </label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                className={`form-input ${errors.age ? 'error' : ''}`}
                placeholder="הכנס את גילך"
                min="1"
                max="120"
                disabled={isSubmitting}
              />
              {errors.age && <span className="error-message">{errors.age}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="address" className="form-label">
                כתובת *
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className={`form-textarea ${errors.address ? 'error' : ''}`}
                placeholder="הכנס את כתובתך המלאה"
                rows="3"
                maxLength="200"
                disabled={isSubmitting}
              />
              {errors.address && <span className="error-message">{errors.address}</span>}
            </div>

            {/* Electronic Signature */}
            <div className="form-group">
              <label className="form-label">
                חתימה אלקטרונית *
              </label>
              <div className="signature-container">
                <canvas
                  ref={canvasRef}
                  className={`signature-canvas ${signatureError ? 'error' : ''}`}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={(e) => {
                    e.preventDefault()
                    const touch = e.touches[0]
                    const rect = e.target.getBoundingClientRect()
                    const offsetX = touch.clientX - rect.left
                    const offsetY = touch.clientY - rect.top
                    setIsDrawing(true)
                    contextRef.current.beginPath()
                    contextRef.current.moveTo(offsetX, offsetY)
                  }}
                  onTouchMove={(e) => {
                    e.preventDefault()
                    if (!isDrawing) return
                    const touch = e.touches[0]
                    const rect = e.target.getBoundingClientRect()
                    const offsetX = touch.clientX - rect.left
                    const offsetY = touch.clientY - rect.top
                    contextRef.current.lineTo(offsetX, offsetY)
                    contextRef.current.stroke()
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault()
                    stopDrawing()
                  }}
                />
                {signatureError && <span className="error-message">{signatureError}</span>}
                <div className="signature-actions">
                  <button
                    type="button"
                    className="clear-signature-btn"
                    onClick={clearSignature}
                    disabled={isSubmitting}
                  >
                    נקה חתימה
                  </button>
                </div>
                <p className="signature-instructions">
                  חתום על הקו המקווקו למעלה כדי לאשר את הטופס
                </p>
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'שולח...' : 'שלח טופס'}
              </button>
              <button 
                type="button" 
                onClick={handleReset} 
                className="reset-btn"
                disabled={isSubmitting}
              >
                נקה טופס
              </button>
            </div>
            
            {isSubmitting && (
              <div className="submission-status">
                <div className="loading-spinner"></div>
                <p>שולח את הטופס...</p>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  )
}

export default App
