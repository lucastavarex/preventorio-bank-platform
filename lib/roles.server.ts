import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import {
  getRoleFromClaims,
  isAdminRole,
  parseRole,
  type Role,
} from '@/lib/roles'

export async function getRole(): Promise<Role | undefined> {
  const { sessionClaims } = await auth()
  const fromClaims = getRoleFromClaims(sessionClaims)

  if (fromClaims) {
    return fromClaims
  }

  const user = await currentUser()
  return parseRole(user?.publicMetadata?.role)
}

export async function requireAdmin() {
  const role = await getRole()

  if (!isAdminRole(role)) {
    redirect('/dashboard')
  }
}
