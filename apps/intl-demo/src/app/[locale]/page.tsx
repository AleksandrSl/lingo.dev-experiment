import { getTranslations, setRequestLocale } from 'next-intl/server';
import ServerExample from '@/components/ServerExample';
import ClientExample from '@/components/ClientExample';
import LanguageSwitcher from '@/components/LanguageSwitcher';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;

  // Enable static rendering
  setRequestLocale(locale);

  const t = await getTranslations('HomePage');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h1 className="text-4xl font-bold mb-3 text-gray-900">
              {t('title')}
            </h1>
            <p className="text-lg text-gray-600 mb-4">{t('description')}</p>
            <LanguageSwitcher />
          </div>
        </header>

        {/* Main Content */}
        <main className="space-y-8">
          {/* Server Component Section */}
          <section>
            <h2 className="text-3xl font-bold mb-4 text-gray-800">
              {t('serverSection')}
            </h2>
            <ServerExample />
          </section>

          {/* Client Component Section */}
          <section>
            <h2 className="text-3xl font-bold mb-4 text-gray-800">
              {t('clientSection')}
            </h2>
            <ClientExample />
          </section>

          {/* Additional Features Section */}
          <section className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Additional Translation Features
            </h2>
            <div className="space-y-3 text-gray-700">
              <p className="text-lg">
                <strong>Rich Text Formatting:</strong> next-intl supports{' '}
                <em>formatting</em> and <strong>styling</strong>
              </p>
              <p className="text-lg">
                <strong>Pluralization:</strong> Handles singular and plural forms
                automatically
              </p>
              <p className="text-lg">
                <strong>Number & Date Formatting:</strong> Locale-aware formatting
                for numbers, currencies, and dates
              </p>
              <p className="text-lg">
                <strong>Nested Messages:</strong> Organize translations in a
                hierarchical structure
              </p>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-600">
          <p>Built with Next.js {process.env.npm_package_version} and next-intl</p>
        </footer>
      </div>
    </div>
  );
}
