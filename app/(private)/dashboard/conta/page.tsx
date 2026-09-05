import { auth, currentUser } from '@clerk/nextjs/server'
import { InfoIcon } from 'lucide-react'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DEFAULT_ROLE, parseRole, type Role } from '@/lib/roles'

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  member: 'Membro',
}

function getInitials(name: string, email: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }

  if (parts[0]) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return email.slice(0, 2).toUpperCase() || '?'
}

export default async function ContaPage() {
  const user = await currentUser()

  if (!user) {
    redirect('/sign-in')
  }

  const { orgRole } = await auth()
  const name = user.fullName || user.firstName || 'Usuário'
  const email = user.primaryEmailAddress?.emailAddress ?? ''
  const role = parseRole(orgRole) ?? DEFAULT_ROLE

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-bold text-2xl">Conta</h1>
        <p className="text-muted-foreground text-sm">
          Seus dados neste portal.
        </p>
      </div>

      <div className="flex max-w-xl flex-col gap-8 sm:flex-row sm:gap-10">
        {user.imageUrl ? (
          <Image
            src={user.imageUrl}
            alt={name}
            width={96}
            height={96}
            unoptimized
            className="size-24 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div className="flex size-24 shrink-0 items-center justify-center rounded-xl bg-muted font-medium text-lg">
            {getInitials(name, email)}
          </div>
        )}

        <dl className="grid min-w-0 flex-1 grid-cols-[7rem_1fr] items-baseline gap-x-6 gap-y-5">
          <dt className="text-muted-foreground text-sm">Nome</dt>
          <dd className="min-w-0 truncate font-medium text-sm">{name}</dd>

          <dt className="text-muted-foreground text-sm">E-mail</dt>
          <dd className="min-w-0 truncate text-sm">{email || 'Sem e-mail'}</dd>

          <dt className="text-muted-foreground text-sm">Papel</dt>
          <dd className="flex items-center gap-1.5">
            <Badge variant={role === 'admin' ? 'default' : 'secondary'}>
              {ROLE_LABELS[role]}
            </Badge>
            <Tooltip>
              <TooltipTrigger
                type="button"
                aria-label="Sobre os papéis de administrador e membro"
                className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <InfoIcon className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent>
                Apenas administradores podem editar as camadas. Membros podem
                apenas visualizá-las.
              </TooltipContent>
            </Tooltip>
          </dd>
        </dl>
      </div>
    </div>
  )
}
