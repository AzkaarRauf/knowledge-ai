import { AUTHOR } from '@/features/about/author'

/** Shared facts for the legal pages. Change the date when you change either page. */
export const LEGAL = {
  appName: 'Knowledge AI',
  operator: AUTHOR.name,
  // where people send privacy or account deletion requests
  contactUrl: AUTHOR.site,
  contactLabel: AUTHOR.siteLabel,
  lastUpdated: 'November 5, 2026',
} as const

export const PRIVACY_ROUTE = '/privacy'
export const TERMS_ROUTE = '/terms'
