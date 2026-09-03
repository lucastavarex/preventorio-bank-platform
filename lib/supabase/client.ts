'use client'

import { useSession } from '@clerk/nextjs'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { useMemo } from 'react'
import type { Database } from './types'

export function useSupabase() {
  const { session } = useSession()

  return useMemo(
    () =>
      createSupabaseClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          async accessToken() {
            return session?.getToken() ?? null
          },
        }
      ),
    [session]
  )
}

export function createAnonClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
