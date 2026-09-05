'use client'

import { useClerk, useUser } from '@clerk/nextjs'
import { BadgeCheckIcon, ChevronsUpDownIcon, LogOutIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type NavUserProps = {
  standalone?: boolean
  compact?: boolean
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

export function NavUser({ standalone = false, compact = false }: NavUserProps) {
  if (standalone) {
    return <StandaloneNavUser compact={compact} />
  }

  return <SidebarNavUser />
}

function SidebarNavUser() {
  const { isMobile } = useSidebar()
  const user = useNavUserData()

  if (!user.isLoaded) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <Skeleton className="size-8 rounded-lg" />
            <div className="grid flex-1 gap-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  if (!user.profile) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <UserDropdown
          profile={user.profile}
          onSignOut={user.signOut}
          side={isMobile ? 'bottom' : 'right'}
          trigger={
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <UserIdentity profile={user.profile} />
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          }
        />
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function StandaloneNavUser({ compact }: { compact: boolean }) {
  const user = useNavUserData()

  if (!user.isLoaded) {
    if (compact) {
      return (
        <Button variant="ghost" size="icon-sm" disabled aria-hidden>
          <Skeleton className="size-7 rounded-lg" />
        </Button>
      )
    }

    return (
      <Button
        variant="ghost"
        className="h-auto w-full justify-start px-2 py-1.5"
        disabled
      >
        <Skeleton className="size-8 rounded-lg" />
        <div className="grid flex-1 gap-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </Button>
    )
  }

  if (!user.profile) {
    return null
  }

  const trigger = compact ? (
    <Button
      variant="ghost"
      size="icon-sm"
      title={user.profile.name}
      aria-label={user.profile.name}
    >
      <UserAvatar profile={user.profile} className="size-7" />
    </Button>
  ) : (
    <Button variant="ghost" className="h-auto w-full justify-start px-2 py-1.5">
      <UserIdentity profile={user.profile} />
      <ChevronsUpDownIcon className="ml-auto size-4" />
    </Button>
  )

  return (
    <UserDropdown
      profile={user.profile}
      onSignOut={user.signOut}
      side={compact ? 'right' : 'top'}
      trigger={trigger}
    />
  )
}

function useNavUserData() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()

  const profile = user
    ? {
        name: user.fullName || user.firstName || 'Usuário',
        email: user.primaryEmailAddress?.emailAddress ?? '',
        avatar: user.imageUrl ?? '',
      }
    : null

  return {
    isLoaded,
    profile: profile
      ? { ...profile, initials: getInitials(profile.name, profile.email) }
      : null,
    signOut: () => signOut({ redirectUrl: '/sign-in' }),
  }
}

type UserProfile = {
  name: string
  email: string
  avatar: string
  initials: string
}

function UserAvatar({
  profile,
  className = 'size-8',
}: {
  profile: UserProfile
  className?: string
}) {
  return (
    <Avatar className={cn('rounded-lg', className)}>
      <AvatarImage src={profile.avatar} alt={profile.name} />
      <AvatarFallback className="rounded-lg">{profile.initials}</AvatarFallback>
    </Avatar>
  )
}

function UserIdentity({ profile }: { profile: UserProfile }) {
  return (
    <>
      <UserAvatar profile={profile} />
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{profile.name}</span>
        <span className="truncate text-xs">{profile.email}</span>
      </div>
    </>
  )
}

function UserDropdown({
  profile,
  onSignOut,
  side,
  trigger,
}: {
  profile: UserProfile
  onSignOut: () => void
  side: 'top' | 'right' | 'bottom'
  trigger: ReactNode
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-fit"
        side={side}
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <UserIdentity profile={profile} />
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <BadgeCheckIcon />
            Conta
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSignOut}>
          <LogOutIcon />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
