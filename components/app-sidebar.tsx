'use client'

import {
  BookOpenIcon,
  FrameIcon,
  MapIcon,
  PieChartIcon,
  TerminalSquareIcon,
} from 'lucide-react'
import type * as React from 'react'
import { NavMain } from '@/components/nav-main'
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

// This is sample data.
const data = {
  user: {
    name: 'Luiz Arthur',
    email: 'luizart@cos.ufrj.br',
    avatar: '',
  },
  navMain: [
    {
      title: 'Geoportal',
      url: '#',
      icon: <MapIcon />,
      isActive: true,
      items: [
        {
          title: 'Gerenciar mapas',
          url: '/dashboard/geoportal/gerenciar-mapas',
        },
        {
          title: 'Gerenciar usuários',
          url: '/dashboard/geoportal/gerenciar-usuarios',
        },
        {
          title: 'Acessar o Geoportal',
          url: '/geoportal',
          newTab: true,
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
        {
          title: 'Metodologia',
          url: '#',
        },
      ],
    },
  ],
  projects: [
    {
      name: 'Site',
      url: 'https://bancopreventorio.org.br/',
      // icon: <FrameIcon />,
    },
    {
      name: 'Artigo "Mapeando o (in)visível"',
      url: 'https://zenodo.org/records/16809202',
      // icon: <BookOpenIcon />,
    },
    {
      name: 'Sobre',
      url: '#',
      // icon: <MapIcon />,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold">
                  B
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    Banco do Preventório
                  </span>
                  <span className="truncate text-xs">Portal interno</span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
