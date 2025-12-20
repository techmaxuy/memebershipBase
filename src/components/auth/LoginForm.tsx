"use client"

import { useTransition, useState } from "react";
import { login, socialLogin } from "@/actions/auth";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { FaGithub, FaGoogle, FaMicrosoft } from "react-icons/fa";
import { AlertCircle } from "lucide-react";
import { VerifyEmailBanner } from "./VerifyEmailBanner";

interface LoginFormProps {
    locale: string;
}

export function LoginForm({ locale }: LoginFormProps) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | undefined>("");
    const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
    const t = useTranslations('LoginPage');
    const tErrors = useTranslations('AuthErrors');

    const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setUnverifiedEmail(null);
        const formData = new FormData(event.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        startTransition(() => {
            login({ email, password }, locale)
                .then((data) => {
                    if (data?.error) {
                        // Si el error es email no verificado, mostrar banner
                        if (data.error === "EmailNotVerified" && data.email) {
                            setUnverifiedEmail(data.email);
                        } else {
                            const errorMessages: Record<string, string> = {
                                InvalidFields: tErrors('invalidFields'),
                                UserNotFound: tErrors('userNotFound'),
                                UseOAuthProvider: tErrors('useOAuthProvider'),
                                InvalidPassword: tErrors('invalidPassword'),
                                DatabaseError: tErrors('databaseError'),
                                AuthError: tErrors('authError'),
                            }
                            setError(errorMessages[data.error] || tErrors('unknownError'));
                        }
                    }
                });
        });
    };

    const handleSocialLogin = (provider: "google" | "github" | "microsoft-entra-id") => {
        startTransition(() => {
            socialLogin(provider, 'login', locale);
        });
    };

    // Si el email no está verificado, mostrar banner
    if (unverifiedEmail) {
        return (
            <div className="space-y-6">
                <VerifyEmailBanner email={unverifiedEmail} locale={locale} />
                <button
                    onClick={() => setUnverifiedEmail(null)}
                    className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                    ← {t('backToLogin') || 'Back to login'}
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Email/Password Form */}
            <form onSubmit={onSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('email')}
                    </label>
                    <input
                        type="email"
                        name="email"
                        required
                        disabled={isPending}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('password')}
                    </label>
                    <input
                        type="password"
                        name="password"
                        required
                        disabled={isPending}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                </div>
                
                {error && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                    </div>
                )}
                
                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPending ? t('signingIn') : t('signInButton')}
                </button>
            </form>

            {/* Divider */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-zinc-900 px-2 text-gray-500">
                        {t('orContinueWith')}
                    </span>
                </div>
            </div>

            {/* Social Login Buttons */}
            <div className="flex flex-col gap-2">
                <button
                    onClick={() => handleSocialLogin('google')}
                    disabled={isPending}
                    className="flex items-center justify-center w-full gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FaGoogle className="w-5 h-5" />
                    <span>{t('signInWith', { provider: 'Google' })}</span>
                </button>
                
                <button
                    onClick={() => handleSocialLogin('github')}
                    disabled={isPending}
                    className="flex items-center justify-center w-full gap-2 px-4 py-2.5 bg-[#24292F] text-white rounded-lg hover:bg-[#24292F]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FaGithub className="w-5 h-5" />
                    <span>{t('signInWith', { provider: 'GitHub' })}</span>
                </button>
                
                <button
                    onClick={() => handleSocialLogin('microsoft-entra-id')}
                    disabled={isPending}
                    className="flex items-center justify-center w-full gap-2 px-4 py-2.5 bg-[#0078D4] text-white rounded-lg hover:bg-[#0078D4]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FaMicrosoft className="w-5 h-5" />
                    <span>{t('signInWith', { provider: 'Microsoft' })}</span>
                </button>
            </div>

            {/* Footer Links */}
            <div className="flex flex-col gap-2 text-center text-sm">
                <Link href="/register" className="text-blue-600 hover:underline dark:text-blue-400">
                    {t('registerLink')}
                </Link>
                <Link href="/" className="text-gray-600 dark:text-gray-400 hover:underline">
                    {t('backToHome')}
                </Link>
            </div>
        </div>
    )
}