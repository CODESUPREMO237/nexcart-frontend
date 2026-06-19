'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { t as translate, LANGUAGES } from './translations'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en')

  useEffect(() => {
    const saved = localStorage.getItem('nexcart_language')
    if (saved && ['en', 'fr', 'pcm'].includes(saved)) {
      setLanguage(saved)
    }
  }, [])

  const changeLanguage = (lang) => {
    setLanguage(lang)
    localStorage.setItem('nexcart_language', lang)
  }

  const t = (key) => translate(key, language)

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export default LanguageContext
