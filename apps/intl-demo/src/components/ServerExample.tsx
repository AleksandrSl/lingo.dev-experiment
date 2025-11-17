import { useTranslations } from 'next-intl';

export default function ServerExample() {
  const t = useTranslations('ServerComponent');
  const currentTime = new Date().toLocaleTimeString();

  return (
    <div className="border-2 border-blue-500 rounded-lg p-6 bg-blue-50">
      <h2 className="text-2xl font-bold mb-3 text-blue-900">{t('title')}</h2>
      <p className="text-gray-700 mb-4">{t('description')}</p>
      <p className="text-lg mb-4 font-semibold">
        {t('currentTime', { time: currentTime })}
      </p>

      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2 text-blue-800">
          {t('benefits.title')}
        </h3>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>{t('benefits.seo')}</li>
          <li>{t('benefits.performance')}</li>
          <li>{t('benefits.security')}</li>
        </ul>
      </div>
    </div>
  );
}
