'use client'

import { useAuth, useClerk, useUser } from '@clerk/nextjs'
import { useEffect, useRef } from 'react'
import { pickOrganizationId } from '@/lib/clerk-organization'

export function ActivateOrganization() {
  const { orgId } = useAuth()
  const { user } = useUser()
  const clerk = useClerk()
  const attemptedForUser = useRef<string | null>(null)
  const sessionUser = clerk.session?.user ?? user
  const userId = sessionUser?.id

  useEffect(() => {
    if (orgId || !userId || !sessionUser) {
      return
    }

    if (attemptedForUser.current === userId) {
      return
    }

    const organizationId = pickOrganizationId(
      sessionUser.organizationMemberships
    )

    if (!organizationId) {
      return
    }

    attemptedForUser.current = userId
    void clerk.setActive({
      ...(clerk.session?.id ? { session: clerk.session.id } : {}),
      organization: organizationId,
    })
  }, [orgId, userId, sessionUser, clerk])

  return null
}
