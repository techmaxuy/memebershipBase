import { auth } from "../../../auth";
import { getTranslations } from 'next-intl/server';
import { UserMenu } from '@/components/UserMenu';

interface HomePageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Home({ params, searchParams }: HomePageProps) {
  const { locale } = await params
  const session = await auth();
  const t = await getTranslations('HomePage');
  const sp = await searchParams;
  const success = sp.success === 'true';
  const error = sp.error;

  return (
    <main className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
      {success && (
        <div className="bg-green-100 border-b border-green-200 text-green-800 px-4 py-3 text-center">
          {t('accountCreated')}
        </div>
      )}
      {error === 'AlreadyRegistered' && (
        <div className="bg-yellow-100 border-b border-yellow-200 text-yellow-800 px-4 py-3 text-center">
          {t('alreadyRegistered')}
        </div>
      )}
      
      {/* Navbar */}
      <nav className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 bg-white dark:bg-black z-50 relative">
        <div className="font-bold text-xl tracking-tight">
          {t('title')}
        </div>
        
        {/* User Menu */}
        <UserMenu
          user={session?.user || null}
          locale={locale}
          isAuthenticated={!!session}
        />
      </nav>

      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4 text-center">
        {!session ? (
          <h1 className="text-4xl font-bold">{t('appWelcome')}</h1>
        ) : (
          <h1 className="text-4xl font-bold">
            {t('userWelcome', { name: session.user?.name || 'User', role: session.user?.role || 'User' })}
          </h1>
        )}
      </div>
    </main>
  );
}