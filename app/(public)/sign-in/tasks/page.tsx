'use client'

import { TaskChooseOrganization, useClerk, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AuthPageShell } from '@/components/auth-page-shell'
import { Spinner } from '@/components/ui/spinner'
import { activateSingleOrganization } from '@/lib/clerk-organization'

export default function SignInTasksPage() {
  const { user, isLoaded } = useUser()
  const clerk = useClerk()
  const router = useRouter()
  const [showPicker, setShowPicker] = useState(false)

  useEffect(() => {
    if (!isLoaded && !clerk.session?.user) {
      return
    }

    let cancelled = false

    void activateSingleOrganization({
      user: clerk.user ?? user,
      session: clerk.session,
      setActive: clerk.setActive,
    }).then(activated => {
      if (cancelled) {
        return
      }

      if (activated) {
        router.replace('/dashboard')
        return
      }

      setShowPicker(true)
    })

    return () => {
      cancelled = true
    }
  }, [isLoaded, user, clerk.user, clerk.session, clerk.setActive, router])

  return (
    <AuthPageShell>
      <div className="flex min-h-48 flex-col justify-center p-6 md:p-8">
        {showPicker ? (
          <TaskChooseOrganization redirectUrlComplete="/dashboard" />
        ) : (
          <div className="flex justify-center">
            <Spinner />
          </div>
        )}
      </div>
    </AuthPageShell>
  )
}
