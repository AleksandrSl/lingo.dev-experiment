'use client';

import { useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

export default function LanguageSwitcher() {
  const t = useTranslations('Common');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const onSelectChange = (newLocale: string) => {
    startTransition(() => {
      // Replace the current locale in the pathname with the new locale
      const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);
      router.replace(newPathname);
    });
  };

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="language-select" className="font-medium text-gray-700">
        {t('language')}:
      </label>
      <select
        id="language-select"
        value={locale}
        onChange={(e) => onSelectChange(e.target.value)}
        disabled={isPending}
        className="px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-900 font-medium hover:border-blue-500 focus:border-blue-500 focus:outline-none transition-colors disabled:opacity-50"
      >
        <option value="en">{t('english')}</option>
        <option value="es">{t('spanish')}</option>
        <option value="de">{t('german')}</option>
      </select>
      {isPending && <span className="text-sm text-gray-500">Loading...</span>}
    </div>
  );
}
