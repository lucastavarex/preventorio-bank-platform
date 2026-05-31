'use client'

import { usePathname } from 'next/navigation'
import { Fragment } from 'react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

const nonClickable = new Set(['dashboard', 'geoportal'])

const labels: Record<string, string> = {
  dashboard: 'Dashboard',
  geoportal: 'Geoportal',
  'gerenciar-mapas': 'Gerenciar mapas',
  'gerenciar-usuarios': 'Gerenciar usuários',
  documentacao: 'Documentação',
}

export function DashboardBreadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join('/')}`
          const label = labels[segment] ?? segment
          const isLast = index === segments.length - 1

          return (
            <Fragment key={href}>
              <BreadcrumbItem>
                {isLast || nonClickable.has(segment) ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
