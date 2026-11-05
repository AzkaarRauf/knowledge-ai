'use client'

import { Info, LogOut, Settings } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AboutDialog } from '@/features/about/components/AboutDialog'
import { useSignOut } from '@/features/auth/hooks/sign-out.hook'

/** Gear button in the user card; holds About and Sign out. */
export function SettingsMenu() {
  const [aboutOpen, setAboutOpen] = useState(false)
  const { signOut, isPending } = useSignOut()

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Settings" />}>
          <Settings />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-40">
          <DropdownMenuItem onClick={() => setAboutOpen(true)}>
            <Info />
            About
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={signOut} disabled={isPending}>
            <LogOut />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {/* dialog lives outside the menu so it stays open after the menu closes */}
      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
    </>
  )
}
