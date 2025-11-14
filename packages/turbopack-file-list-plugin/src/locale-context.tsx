'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Locale = 'en' | 'ru' | 'pseudo';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

const LOCALE_COOKIE_NAME = 'lingo-locale';

/**
 * Gets the current locale from cookie
 */
function getLocaleFromCookie(): Locale {
  if (typeof document === 'undefined') return 'en';

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === LOCALE_COOKIE_NAME) {
      return value as Locale;
    }
  }
  return 'en';
}

/**
 * Saves locale to cookie
 */
function saveLocaleToCookie(locale: Locale): void {
  if (typeof document === 'undefined') return;

  // Set cookie with 1 year expiration
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; expires=${expires.toUTCString()}; path=/`;
}

interface LocaleProviderProps {
  children: React.ReactNode;
  initialLocale?: Locale;
}

export function LocaleProvider({ children, initialLocale }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale || 'en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // On mount, read from cookie
    const cookieLocale = getLocaleFromCookie();
    if (cookieLocale && cookieLocale !== locale) {
      setLocaleState(cookieLocale);
    }
    setMounted(true);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    saveLocaleToCookie(newLocale);
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <LocaleContext.Provider value={{ locale: initialLocale || 'en', setLocale }}>
      {children}
    </LocaleContext.Provider>;
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return context;
}
