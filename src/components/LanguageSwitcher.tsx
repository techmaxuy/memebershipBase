'use client';

import { usePathname, useRouter } from '@/i18n/routing';
import { useLocale } from 'next-intl';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleLocaleChange('en')}
        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
          locale === 'en'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => handleLocaleChange('es')}
        className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
          locale === 'es'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700'
        }`}
      >
        ES
      </button>
    </div>
  );
}
