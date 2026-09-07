'use client'

import { useAuth } from '@clerk/nextjs'
import { BookOpenIcon, FolderIcon, HouseIcon, MapIcon } from 'lucide-react'
import type * as React from 'react'
import { BrandMark } from '@/components/brand-mark'
import { type NavItem, NavMain } from '@/components/nav-main'
import { NavProjects } from '@/components/nav-projects'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { CLERK_ORG_ROLES } from '@/lib/roles'
import { PARTNERS, ROUTES, SITE_NAME, SITE_SUBTITLE } from '@/lib/site'

const data: {
  navMain: NavItem[]
  projects: { name: string; url: string }[]
} = {
  navMain: [
    {
      title: 'Início',
      url: ROUTES.dashboard,
      icon: <HouseIcon />,
    },
    {
      title: 'Geoportal',
      url: '#',
      icon: <MapIcon />,
      isActive: true,
      items: [
        {
          title: 'Acessar o Geoportal',
          url: '/geoportal',
          newTab: true,
        },
      ],
    },
    {
      title: 'Gestão',
      url: '#',
      icon: <FolderIcon />,
      isActive: true,
      adminOnly: true,
      items: [
        {
          title: 'Grupos',
          url: '/dashboard/groups',
          adminOnly: true,
        },
        {
          title: 'Layers',
          url: '/dashboard/layers',
          adminOnly: true,
        },
        {
          title: 'Mapas',
          url: '/dashboard/maps',
          adminOnly: true,
        },
      ],
    },
    {
      title: 'Documentação',
      url: '#',
      icon: <BookOpenIcon />,
      items: [
        {
          title: 'Repositório',
          url: 'https://github.com/lucastavarex/preventorio-bank-platform',
        },
        {
          title: 'WP3 Brazil data',
          url: 'https://onedrive.live.com/?redeem=aHR0cHM6Ly8xZHJ2Lm1zL2YvcyFBaFlOR1huNVVWcllnY0VKNV84U21PeG9ueWtYdVE&id=D85A51F979190D16%2124713&cid=D85A51F979190D16&sb=name&sd=1',
        },
      ],
    },
  ],
  projects: [
    {
      name: PARTNERS.banco.name,
      url: PARTNERS.banco.url,
    },
    {
      name: 'Artigo "Mapeando o (in)visível"',
      url: ROUTES.artigo,
    },
    {
      name: 'Sobre',
      url: ROUTES.sobre,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { has, isLoaded } = useAuth()
  const isAdmin = isLoaded && (has?.({ role: CLERK_ORG_ROLES.admin }) ?? false)

  const navMain = data.navMain
    .filter(item => !item.adminOnly || isAdmin)
    .map(item => ({
      ...item,
      items: item.items?.filter(subItem => !subItem.adminOnly || isAdmin),
    }))
    .filter(item => !item.items || item.items.length > 0)

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div>
                <BrandMark />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{SITE_NAME}</span>
                  <span className="truncate text-xs">{SITE_SUBTITLE}</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
