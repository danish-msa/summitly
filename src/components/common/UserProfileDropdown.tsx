"use client"

import { useSession, signOut } from 'next-auth/react'
import { 
  Heart, 
  MapPin, 
  Calendar, 
  Layers, 
  User, 
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
import { useRouter } from 'next/navigation'

export function UserProfileDropdown() {
  const { data: session } = useSession()
  const router = useRouter()

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
        <Link href="/dashboard/saved-properties">
          <DropdownMenuItem>
            <Heart className="mr-2 h-4 w-4" />
            <span>Saved Properties</span>
          </DropdownMenuItem>
        </Link>
        <Link href="/dashboard/saved-images">
          <DropdownMenuItem>
            <div className="mr-2 h-4 w-4 relative flex items-center justify-center">
              <div className="absolute inset-0 border border-current rounded-sm"></div>
              <Heart className="h-2.5 w-2.5" fill="currentColor" />
            </div>
            <span>Saved Images</span>
          </DropdownMenuItem>
        </Link>
        <Link href="/dashboard/saved-areas">
          <DropdownMenuItem>
            <MapPin className="mr-2 h-4 w-4" />
            <span>Saved Areas</span>
          </DropdownMenuItem>
        </Link>
        <Link href="/dashboard/saved-communities">
          <DropdownMenuItem>
            <div className="mr-2 h-4 w-4 relative">
              <MapPin className="h-4 w-4" />
              <Heart className="h-2 w-2 absolute top-0 left-0.5" fill="currentColor" />
            </div>
            <span>Saved Communities</span>
          </DropdownMenuItem>
        </Link>
        <Link href="/dashboard/watchlist">
          <DropdownMenuItem>
            <Heart className="mr-2 h-4 w-4" />
            <span>Watchlist</span>
          </DropdownMenuItem>
        </Link>
        <Link href="/dashboard/planned-open-houses">
          <DropdownMenuItem>
            <div className="mr-2 h-4 w-4 relative">
              <Calendar className="h-4 w-4 absolute" />
              <div className="absolute top-0.5 left-1 flex gap-0.5">
                <div className="h-1 w-1 rounded-full bg-current"></div>
                <div className="h-1 w-1 rounded-full bg-current"></div>
                <div className="h-1 w-1 rounded-full bg-current"></div>
              </div>
            </div>
            <span>Planned Open Houses</span>
          </DropdownMenuItem>
        </Link>
        <Link href="/dashboard/recently-viewed">
          <DropdownMenuItem>
            <Layers className="mr-2 h-4 w-4" />
            <span>Recently Viewed</span>
          </DropdownMenuItem>
        </Link>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <span>Account Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut}>
          <ArrowRightFromLine className="mr-2 h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

