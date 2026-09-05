export const ROLES = ['admin', 'member'] as const
export type Role = (typeof ROLES)[number]
export const DEFAULT_ROLE: Role = 'member'

export const CLERK_ORG_ROLES = {
  admin: 'org:admin',
  member: 'org:member',
} as const

export function parseRole(value: unknown): Role | undefined {
  if (value === 'admin' || value === CLERK_ORG_ROLES.admin) {
    return 'admin'
  }

  if (
    value === 'member' ||
    value === CLERK_ORG_ROLES.member ||
    value === 'reader'
  ) {
    return 'member'
  }

  return undefined
}

export function isAdminRole(role: Role | undefined): boolean {
  return role === 'admin'
}

export function canReadPrivateRole(role: Role | undefined): boolean {
  return role === 'admin' || role === 'member'
}
