# Next.js with next-intl Demo

This is a demonstration application showcasing internationalization (i18n) using the latest **next-intl** library with Next.js App Router.

## Features

- **Multiple Locales**: Support for English, Spanish, and German
- **Server Components**: Shows translation in server-rendered components
- **Client Components**: Interactive components with real-time translation updates
- **Language Switcher**: Easy switching between supported languages
- **Middleware**: Automatic locale detection and routing
- **Type-safe**: Full TypeScript support

## Getting Started

### Install Dependencies

From the root of the monorepo:

```bash
pnpm install
```

### Run Development Server

```bash
pnpm --filter intl-demo dev
```

The app will be available at [http://localhost:3001](http://localhost:3001)

### Build for Production

```bash
pnpm --filter intl-demo build
```

### Start Production Server

```bash
pnpm --filter intl-demo start
```

## Project Structure

```
apps/intl-demo/
├── src/
│   ├── app/
│   │   ├── [locale]/          # Locale-specific routes
│   │   │   ├── layout.tsx     # Locale layout with NextIntlClientProvider
│   │   │   └── page.tsx       # Home page
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   ├── ServerExample.tsx  # Server component demo
│   │   ├── ClientExample.tsx  # Client component demo
│   │   └── LanguageSwitcher.tsx # Language switcher component
│   ├── i18n/
│   │   └── request.ts         # next-intl configuration
│   └── middleware.ts          # Locale detection middleware
├── messages/
│   ├── en.json               # English translations
│   ├── es.json               # Spanish translations
│   └── de.json               # German translations
└── package.json
```

## How It Works

### Server Components

Server components can use `useTranslations()` from `next-intl` to access translations during server-side rendering. This provides:

- Better SEO (content is rendered with translations)
- Better performance (no client-side JavaScript needed)
- Direct access to backend resources

### Client Components

Client components marked with `'use client'` can also use `useTranslations()` for interactive features:

- State management with React hooks
- Dynamic updates without page reload
- Real-time user interactions

### Middleware

The middleware (`src/middleware.ts`) handles:

- Automatic locale detection from browser settings
- URL-based locale routing (`/en`, `/es`, `/de`)
- Redirects to appropriate locale

### Translation Files

Translation messages are organized in JSON files under `messages/`:

- Nested structure for organization
- Support for interpolation: `{variable}`
- Support for pluralization
- Support for number and date formatting

## Adding New Translations

1. Add new keys to all locale files in `messages/`
2. Use the translation key in your component:

```tsx
const t = useTranslations('YourNamespace');
<p>{t('yourKey')}</p>
```

## Adding New Locales

1. Add the locale code to `locales` array in `src/i18n/request.ts`
2. Create a new message file in `messages/[locale].json`
3. Update the middleware matcher in `src/middleware.ts`
4. Add the locale option to the `LanguageSwitcher` component

## Learn More

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
