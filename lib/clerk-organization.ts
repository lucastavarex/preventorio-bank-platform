type OrganizationMembershipLike = {
  organization: { id: string }
}

type SessionLike = {
  id?: string
  user?: {
    organizationMemberships: ReadonlyArray<OrganizationMembershipLike>
  } | null
}

export function pickOrganizationId(
  memberships: ReadonlyArray<OrganizationMembershipLike> | null | undefined
): string | undefined {
  if (!memberships?.length) {
    return undefined
  }

  const preferred = process.env.NEXT_PUBLIC_CLERK_ORGANIZATION_ID

  if (preferred) {
    return memberships.find(
      membership => membership.organization.id === preferred
    )?.organization.id
  }

  return memberships[0]?.organization.id
}

export async function activateSingleOrganization(clerk: {
  user?: {
    organizationMemberships: ReadonlyArray<OrganizationMembershipLike>
  } | null
  session?: SessionLike | string | null
  setActive: (params: {
    session?: string
    organization: string
  }) => Promise<void>
}) {
  const session = clerk.session
  const sessionId = typeof session === 'string' ? session : session?.id
  const organizationId = pickOrganizationId(
    clerk.user?.organizationMemberships ??
      (typeof session === 'string'
        ? undefined
        : session?.user?.organizationMemberships)
  )

  if (!organizationId) {
    return false
  }

  try {
    await clerk.setActive({
      ...(sessionId ? { session: sessionId } : {}),
      organization: organizationId,
    })
    return true
  } catch {
    return false
  }
}
