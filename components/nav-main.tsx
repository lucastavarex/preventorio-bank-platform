'use client'

import { ChevronRightIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'

export type NavSubItem = {
  title: string
  url: string
  newTab?: boolean
  adminOnly?: boolean
}

export type NavItem = {
  title: string
  url: string
  icon?: React.ReactNode
  isActive?: boolean
  adminOnly?: boolean
  items?: NavSubItem[]
}

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
      <SidebarMenu>
        {items.map(item => {
          const isParentActive =
            item.items?.some(
              sub => pathname === sub.url || pathname.startsWith(`${sub.url}/`)
            ) ?? false

          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive || isParentActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={isParentActive}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                    <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map(subItem => {
                      const isSubActive =
                        !subItem.newTab &&
                        (pathname === subItem.url ||
                          pathname.startsWith(`${subItem.url}/`))

                      const isExternal = /^https?:\/\//.test(subItem.url)

                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild isActive={isSubActive}>
                            {subItem.newTab || isExternal ? (
                              <a
                                href={subItem.url}
                                {...(subItem.newTab && {
                                  target: '_blank',
                                  rel: 'noopener noreferrer',
                                })}
                              >
                                <span>{subItem.title}</span>
                              </a>
                            ) : (
                              <Link href={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            )}
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
