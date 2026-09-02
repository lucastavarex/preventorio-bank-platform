export const ROLES = ['admin', 'reader'] as const
export type Role = (typeof ROLES)[number]
export const DEFAULT_ROLE: Role = 'reader'

export function parseRole(value: unknown): Role | undefined {
  if (value === 'admin' || value === 'reader') {
    return value
  }

  return undefined
}

export function getRoleFromClaims(
  sessionClaims: CustomJwtSessionClaims | null | undefined
): Role | undefined {
  return parseRole(sessionClaims?.metadata?.role)
}

export function isAdminRole(role: Role | undefined): boolean {
  return role === 'admin'
}
