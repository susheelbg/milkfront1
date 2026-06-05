import React, { createContext, useState, useEffect } from 'react';
import knTranslations from './kn.json';
import enTranslations from './en.json';
import { authApi } from '../services/api/authApi';

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

  // When user logins or updates, we want to align the language preference
  useEffect(() => {
    const user = authApi.getCurrentUser();
    if (user && user.language && user.language !== language) {
      setLanguageState(user.language);
      localStorage.setItem('appLanguage', user.language);
    }
  }, []);

  const changeLanguage = async (newLang) => {
    if (newLang !== 'kn' && newLang !== 'en') return;
    
    setLanguageState(newLang);
    localStorage.setItem('appLanguage', newLang);

    // If logged in, also update user profile on the backend
    if (authApi.isAuthenticated()) {
      try {
        const currentUser = authApi.getCurrentUser();
        await authApi.updateProfile({
          ...currentUser,
          name: currentUser.name,
          language: newLang,
        });
      } catch (err) {
        console.error('Failed to save language preference to user profile:', err);
      }
    }
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
