'use client';

import React from 'react';
import { useLocale, type Locale } from './locale-context';

const languages: { code: Locale; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'pseudo', label: '[Þšéúðó]' },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div style={{
      display: 'flex',
      gap: '0.5rem',
      padding: '1rem',
      borderBottom: '1px solid #eee'
    }}>
      <span style={{ marginRight: '0.5rem' }}>Language:</span>
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLocale(lang.code)}
          style={{
            padding: '0.25rem 0.75rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
            background: locale === lang.code ? '#007bff' : 'white',
            color: locale === lang.code ? 'white' : 'black',
            cursor: 'pointer',
            fontWeight: locale === lang.code ? 'bold' : 'normal',
          }}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
