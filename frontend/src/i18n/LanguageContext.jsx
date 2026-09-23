import React, { createContext, useState, useEffect } from 'react';
import knTranslations from './kn.json';
import enTranslations from './en.json';
export const LanguageContext = createContext();

const translations = {
  kn: knTranslations,
  en: enTranslations,
};

export const LanguageProvider = ({ children }) => {
  // Try to load language from localStorage, fallback to Kannada ('kn')
  const [language, setLanguageState] = useState(() => {
    const savedLanguage = localStorage.getItem('appLanguage');
    if (savedLanguage === 'kn' || savedLanguage === 'en') {
      return savedLanguage;
    }
    return 'kn'; // Default to Kannada
  });

  const changeLanguage = (newLang) => {
    if (newLang !== 'kn' && newLang !== 'en') return;
    
    setLanguageState(newLang);
    localStorage.setItem('appLanguage', newLang);
  };

  // Helper function to resolve dot-notation translation keys
  const t = (keyPath) => {
    const keys = keyPath.split('.');
    let current = translations[language];
    
    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        // Fallback to English key path if not found in current language
        let enCurrent = translations['en'];
        for (const enKey of keys) {
          if (enCurrent && enCurrent[enKey] !== undefined) {
            enCurrent = enCurrent[enKey];
          } else {
            return keyPath;
          }
        }
        return enCurrent;
      }
    }
    
    return current;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
