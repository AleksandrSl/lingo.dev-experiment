'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export default function ClientExample() {
  const t = useTranslations('ClientComponent');
  const [count, setCount] = useState(0);

  return (
    <div className="border-2 border-green-500 rounded-lg p-6 bg-green-50">
      <h2 className="text-2xl font-bold mb-3 text-green-900">{t('title')}</h2>
      <p className="text-gray-700 mb-4">{t('description')}</p>

      <div className="bg-white p-6 rounded-lg shadow-md mb-4">
        <h3 className="text-xl font-semibold mb-3 text-green-800">
          {t('counter')}
        </h3>
        <p className="text-3xl font-bold mb-4 text-center text-green-600">
          {t('count', { count })}
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => setCount(count - 1)}
            className="px-6 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
          >
            {t('decrement')}
          </button>
          <button
            onClick={() => setCount(0)}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
          >
            {t('reset')}
          </button>
          <button
            onClick={() => setCount(count + 1)}
            className="px-6 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
          >
            {t('increment')}
          </button>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2 text-green-800">
          {t('benefits.title')}
        </h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>{t('benefits.interactive')}</li>
          <li>{t('benefits.dynamic')}</li>
          <li>{t('benefits.realtime')}</li>
        </ul>
      </div>
    </div>
  );
}
