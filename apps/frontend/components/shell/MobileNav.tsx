'use client'

import { Menu } from 'lucide-react'
import { useState } from 'react'
import { SidebarNav } from '@/components/shell/SidebarNav'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

/** Menu button for small screens; opens the same nav the sidebar shows. */
export function MobileNav({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<Button variant="ghost" size="icon" aria-label="Open menu" />}>
        <Menu />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3">
        <SidebarNav isAdmin={isAdmin} highlightActive onNavigate={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}
