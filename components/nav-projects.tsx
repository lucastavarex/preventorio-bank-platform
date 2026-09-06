'use client'

import { ExternalLinkIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

function isExternalUrl(url: string) {
  return /^https?:\/\//.test(url)
}

export function NavProjects({
  projects,
}: {
  projects: {
    name: string
    url: string
    icon?: React.ReactNode
  }[]
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Links relacionados</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map(item => {
          const external = isExternalUrl(item.url)
          const isActive = !external && pathname === item.url

          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton asChild isActive={isActive}>
                {external ? (
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.icon}
                    <span>{item.name}</span>
                  </a>
                ) : (
                  <Link href={item.url}>
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                )}
              </SidebarMenuButton>
              {external ? (
                <SidebarMenuAction showOnHover asChild>
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLinkIcon />
                    <span className="sr-only">Abrir link</span>
                  </a>
                </SidebarMenuAction>
              ) : null}
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
