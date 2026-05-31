'use client'

import { ExternalLinkIcon, LinkIcon } from 'lucide-react'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

export function NavProjects({
  projects,
}: {
  projects: {
    name: string
    url: string
    icon?: React.ReactNode
  }[]
}) {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Links relacionados</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map(item => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                {item.icon}
                <span>{item.name}</span>
              </a>
            </SidebarMenuButton>
            <SidebarMenuAction showOnHover asChild>
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                <ExternalLinkIcon />
                <span className="sr-only">Abrir link</span>
              </a>
            </SidebarMenuAction>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
