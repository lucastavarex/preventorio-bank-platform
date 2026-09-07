import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { DashboardHome } from '@/components/dashboard/dashboard-home'
import { getDashboardOverview } from '@/lib/actions/dashboard'
import { DEFAULT_ROLE, parseRole } from '@/lib/roles'

export default async function DashboardPage() {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  const { orgRole } = await auth()
  const role = parseRole(orgRole) ?? DEFAULT_ROLE
  const name = user.fullName || user.firstName || 'Usuário'
  const overview = await getDashboardOverview()

  return <DashboardHome name={name} role={role} overview={overview} />
}
