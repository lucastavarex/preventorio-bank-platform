import { requireAdmin } from '@/lib/roles.server'

export default async function GerenciarUsuariosPage() {
  await requireAdmin()

  return <h1 className="text-2xl font-bold">Gerenciar usuários</h1>
}
