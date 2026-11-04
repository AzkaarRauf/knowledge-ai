import type { MetadataRoute } from 'next'

// Pages stay crawlable so bots can see the noindex tag. Only backend paths are blocked.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/health'] },
  }
}
