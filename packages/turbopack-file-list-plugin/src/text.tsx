'use client';

import React, { useEffect, useState } from 'react';
import { useLocale } from './locale-context';
import { t } from './runtime';

interface TextProps {
  hash: string;
}

/**
 * Client-side component that displays translated text based on current locale
 * This component re-renders when the locale changes
 */
export function Text({ hash }: TextProps) {
  const { locale } = useLocale();
  const [text, setText] = useState(() => t(hash, locale));

  useEffect(() => {
    setText(t(hash, locale));
  }, [hash, locale]);

  // Force update on locale change event
  useEffect(() => {
    const handleLocaleChange = () => {
      setText(t(hash, locale));
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('locale-change', handleLocaleChange);
      return () => window.removeEventListener('locale-change', handleLocaleChange);
    }
  }, [hash, locale]);

  return <>{text}</>;
}
