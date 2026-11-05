import { ImageResponse } from 'next/og'
import { AUTHOR } from '@/features/about/author'

export const alt = `Knowledge AI, built by ${AUTHOR.name}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/** Link preview card shown when the app url is shared. Built once at build time. */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 80,
        background: '#3a4fd6',
        color: '#fafaff',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 22,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* same mark as app/icon.svg */}
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#fafaff" strokeWidth="2.4">
            <path d="M6 4v16M6 12l7-8M6 12l7 8" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="18" cy="12" r="2.5" fill="#fafaff" stroke="none" />
          </svg>
        </div>
        <div style={{ fontSize: 44, fontWeight: 600 }}>Knowledge AI</div>
      </div>
      <div style={{ display: 'flex', fontSize: 68, fontWeight: 600, lineHeight: 1.15, maxWidth: 900 }}>
        Your organization&apos;s knowledge, one question away.
      </div>
      <div style={{ display: 'flex', fontSize: 30, opacity: 0.75 }}>Built by {AUTHOR.siteLabel}</div>
    </div>,
    size,
  )
}
