'use client'

import { useEffect } from 'react'
import { AUTHOR } from '@/features/about/author'

// module flag so dev Strict Mode double effects still log once
let logged = false

/** Prints a small signature in the browser devtools console. Renders nothing. */
export function ConsoleSignature() {
  useEffect(() => {
    if (logged) return
    logged = true
    console.log(
      `%cKnowledge AI%c\nBuilt by ${AUTHOR.name} · ${AUTHOR.site}\nPoking around? Say hi: ${AUTHOR.github}`,
      'font: 600 20px system-ui; color: #3a4fd6;',
      'font: 12px system-ui; color: inherit;',
    )
  }, [])

  return null
}
