import { AppShell } from '@/components/app-shell'

export default function SobreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell>{children}</AppShell>
}
