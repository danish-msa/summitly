"use client"

import { useSession, signOut } from 'next-auth/react'
import { 
  LayoutDashboard,
  Heart, 
  Bell,
  MessageSquare,
  Calendar,
  Settings,
  ArrowRightFromLine 
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'

export function UserProfileDropdown() {
  const { data: session } = useSession()

  if (!session?.user) {
    return null
  }

  const userInitials = session.user.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session.user.image || undefined} alt={session.user.name || 'User'} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 z-[100]">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {session.user.name || 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {session.user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <Link href="/dashboard">
          <DropdownMenuItem>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </DropdownMenuItem>
        </Link>
        <Link href="/dashboard/saved">
          <DropdownMenuItem>
            <Heart className="mr-2 h-4 w-4" />
            <span>Saved Properties</span>
          </DropdownMenuItem>
        </Link>
        <Link href="/dashboard/alerts">
          <DropdownMenuItem>
            <Bell className="mr-2 h-4 w-4" />
            <span>Alerts</span>
          </DropdownMenuItem>
        </Link>
        <Link href="/dashboard/chat">
          <DropdownMenuItem>
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>Chat</span>
          </DropdownMenuItem>
        </Link>
        <Link href="/dashboard/tours">
          <DropdownMenuItem>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Tours & Appointments</span>
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <Link href="/dashboard/settings">
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </Link>
        <DropdownMenuItem onClick={handleSignOut}>
          <ArrowRightFromLine className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

