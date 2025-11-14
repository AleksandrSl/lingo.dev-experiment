'use client';

import { useLocale } from 'turbopack-file-list-plugin';
import { t } from 'turbopack-file-list-plugin/dist/runtime';

export default function Home() {
  const { locale } = useLocale();

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>{t('e26aa56ec27b4d9c', locale)}</h1>
      <p>
        {t('43f5b835bb5048b4', locale)}
      </p>
      <p>
        {t('bde3a871ff902beb', locale)} <code>{t('0517b43d09692dd0', locale)}</code> {t('a0defe72fea87146', locale)}
      </p>
    </main>
  );
}
