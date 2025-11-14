'use client';

import { useLocale } from 'turbopack-file-list-plugin/client';

export default function Home() {
  const { locale } = useLocale();

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Turbopack File List Plugin Demo</h1>
      <p>
        This Next.js app is built with Turbopack and includes a custom plugin
        that generates a list of all files used in the build.
      </p>
      <p>
        After building, check <code>.next/list.json</code> for the file list.
      </p>
    </main>
  );
}
