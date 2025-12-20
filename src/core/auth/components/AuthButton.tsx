
import { signIn } from "../../../../auth"
import { cookies } from "next/headers"

interface AuthButtonProps {
    provider: string
    intent: 'login' | 'register'
    className?: string
    locale: string
    children: React.ReactNode
}

export function AuthButton({ provider, intent, className, locale, children }: AuthButtonProps) {
    return (
        <form
            action={async () => {
                "use server"
                const cookieStore = await cookies()
                // Set cookie with short maxAge to prevent it from persisting too long
                cookieStore.set('auth_intent', intent, { path: '/', maxAge: 300 }) // 5 minutes

                const redirectTo = intent === 'register' ? `/${locale}?success=true` : `/${locale}`
                await signIn(provider, { redirectTo })
            }}
        >
            <button className={className} type="submit">{children}</button>
        </form>
    )
}
