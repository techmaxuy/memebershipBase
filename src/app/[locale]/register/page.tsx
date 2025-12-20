import { RegisterForm } from "@/core/auth/components/RegisterForm";
import { getTranslations } from 'next-intl/server';
import { AuthErrorMessage } from "@/core/auth/components/AuthErrorMessage"

interface RegisterPageProps {
    params: Promise<{ locale: string }>
}

export default async function RegisterPage({ params }: RegisterPageProps) {
    const t = await getTranslations('RegisterPage');
    const { locale } = await params;

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-black p-4">
            <div className="w-full max-w-md p-8 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-gray-200 dark:border-zinc-800">
                <h1 className="text-2xl font-bold text-center mb-6 text-black dark:text-white">
                    {t('createAccount')}
                </h1>
                
                {/* Mensajes de error/éxito globales */}
                <AuthErrorMessage />
                
                {/* Formulario único con todo integrado */}
                <RegisterForm locale={locale} />
            </div>
        </div>
    );
}