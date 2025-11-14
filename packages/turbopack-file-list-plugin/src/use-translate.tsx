'use client';

import { useCallback } from 'react';
import { useLocale } from './locale-context';
import { t as tFunction } from './runtime';

/**
 * Hook that returns a locale-aware translation function
 * This hook ensures that components re-render when the locale changes
 */
export function useTranslate() {
  const { locale } = useLocale();

  const t = useCallback(
    (hash: string) => {
      return tFunction(hash, locale);
    },
    [locale]
  );

  return t;
}
