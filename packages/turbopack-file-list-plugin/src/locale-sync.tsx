'use client';

import { useEffect } from 'react';
import { useLocale } from './locale-context';
import { setLocale } from './runtime';

/**
 * Component that syncs the locale context with the runtime module
 * This ensures that the t() function uses the correct locale on the client
 */
export function LocaleSync() {
  const { locale } = useLocale();

  useEffect(() => {
    // Update the runtime locale whenever the context locale changes
    setLocale(locale);

    // Force a re-render by dispatching a custom event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('locale-change', { detail: { locale } }));
    }
  }, [locale]);

  return null;
}
