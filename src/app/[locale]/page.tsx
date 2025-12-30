import { auth } from "../../../auth";
import { getTranslations } from 'next-intl/server';
import { UserMenu } from '@/core/shared/components/UserMenu';
import { getSettings } from '@/core/admin/actions/settings';
import Image from 'next/image';

interface HomePageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Home({ params, searchParams }: HomePageProps) {
  const { locale } = await params
  const session = await auth();
  const t = await getTranslations('HomePage');
  const sp = await searchParams;
  
  // Obtener configuración del sistema
  const settings = await getSettings();
  
  // Determinar el mensaje de bienvenida según el idioma
  const welcomeMessage = locale === 'es' 
    ? settings?.welcomeMessageEs || t('appWelcome')
    : settings?.welcomeMessageEn || t('appWelcome');
  
  // Nombre de la app
  const appName = settings?.appName || t('title');
  
  // Logo
  const logo = settings?.logo;
  const bgMobile = settings?.backgroundImageMobile || '/images/fondomobile.jpg'
  const bgDesktop = settings?.backgroundImageDesktop || '/images/fondodesktop.jpg'
  
  const success = sp.success === 'true';
  const error = sp.error;

    // ANTES del return, añade esto:
  console.log('🔍 Mobile BG:', bgMobile)
  console.log('🔍 Desktop BG:', bgDesktop)
  console.log('🔍 Session:', session ? 'logged in' : 'guest')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-black dark:via-zinc-900 dark:to-black">
      {success && (
        <div className="bg-green-500 text-white px-4 py-3 text-center font-medium">
          {t('accountCreated')}
        </div>
      )}
      
      {error === 'AlreadyRegistered' && (
        <div className="bg-yellow-500 text-white px-4 py-3 text-center font-medium">
          {t('alreadyRegistered')}
        </div>
      )}
      
      {/* Navbar */}
      <nav className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-zinc-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo y nombre de la app */}
            <div className="flex items-center gap-3">
              {logo && (
                <div className="relative w-10 h-10">
                  <Image
                    src={logo}
                    alt={appName}
                    fill
                    className="object-contain"
                  />
                </div>
              )}
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {appName}
              </h1>
            </div>
            
            {/* User Menu */}
            <UserMenu user={session?.user || null}
          locale={locale}
          isAuthenticated={!!session}/>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative min-h-[80vh]">
        <div className="fixed inset-0 w-full h-full -z-10">
          {/* Mobile */}
          {bgMobile && (
            <Image
              src={bgMobile}
              alt="Background Mobile"
              fill
              priority
              quality={85}
              className="md:hidden object-cover"
              style={{ filter: 'brightness(0.6)' }}
              sizes="100vw"
            />
          )}
          
          {/* Desktop */}
          {bgDesktop && (
            <Image
              src={bgDesktop}
              alt="Background Desktop"
              fill
              priority
              quality={85}
              className="hidden md:block object-cover"
              style={{ filter: 'brightness(0.6)' }}
              sizes="100vw"
            />
          )}
          
          {/* Overlay oscuro */}
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* CONTENIDO - Dentro del max-w-7xl */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="space-y-8">
            {!session ? (
              // Usuario NO autenticado
              <div className="text-center space-y-6">
                <h2 className="text-5xl font-bold text-gray-900 dark:text-white">
                  {welcomeMessage}
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  {locale === 'es' 
                    ? 'Inicia sesión o regístrate para comenzar' 
                    : 'Sign in or register to get started'}
                </p>
              </div>
            ) : (
              // Usuario autenticado
              <div className="text-center space-y-6">
                <div className="inline-block p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
                  <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
                  {t('userWelcome', { 
                    name: session.user?.name || 'User', 
                    role: session.user?.role || 'User' 
                  })}
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                  {locale === 'es' 
                    ? '¡Todo está listo para comenzar!' 
                    : 'Everything is ready to get started!'}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}