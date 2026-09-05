import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import {
  CLERK_ORG_ROLES,
  canReadPrivateRole,
  parseRole,
  type Role,
} from '@/lib/roles'

export async function getRole(): Promise<Role | undefined> {
  const { orgRole } = await auth()
  return parseRole(orgRole)
}

export async function canReadPrivate(): Promise<boolean> {
  return canReadPrivateRole(await getRole())
}

export async function requireAdmin() {
  const { has } = await auth()

  if (!has({ role: CLERK_ORG_ROLES.admin })) {
    redirect('/dashboard')
  }
}
