'use server'

import { cookies, headers } from 'next/headers'
import { prisma } from '@/core/shared/lib/db'

export async function getUserCountry(): Promise<string> {
  try {
    const cookieStore = await cookies()
    const countryCookie = cookieStore.get('user-country')

    if (countryCookie?.value) {
      return countryCookie.value
    }

    const headersList = await headers()
    const country = headersList.get('x-vercel-ip-country')

    return country || 'US'
  } catch (error) {
    console.error('[Geolocation] Error getting user country:', error)
    return 'US'
  }
}

export async function saveUserCountry(userId: string, country: string): Promise<{ success?: boolean; error?: string }> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { country },
    })

    console.log(`[Geolocation] ✅ Saved country ${country} for user ${userId}`)
    return { success: true }
  } catch (error) {
    console.error('[Geolocation] Error saving user country:', error)
    return { error: 'DatabaseError' }
  }
}

export async function getCountryName(countryCode: string): Promise<string> {
  const countryNames: Record<string, string> = {
    US: 'United States',
    UY: 'Uruguay',
    AR: 'Argentina',
    BR: 'Brazil',
    CL: 'Chile',
    CO: 'Colombia',
    MX: 'Mexico',
    ES: 'Spain',
    PE: 'Peru',
    VE: 'Venezuela',
    EC: 'Ecuador',
    BO: 'Bolivia',
    PY: 'Paraguay',
    CR: 'Costa Rica',
    PA: 'Panama',
    DO: 'Dominican Republic',
    GT: 'Guatemala',
    HN: 'Honduras',
    SV: 'El Salvador',
    NI: 'Nicaragua',
    CU: 'Cuba',
    PR: 'Puerto Rico',
  }

  return countryNames[countryCode] || countryCode
}
