export const CITATION_HREF_PREFIX = '#citation:'

const CITATION = /\s*<<\s*Citation\s+\{?([^<>{}]+?)\}?\s*>>/gi
// half-streamed citation at the end, like "<<Cita" or "<<Citation doc.p"
const PARTIAL_CITATION = /\s*<(<[^>\n]*>?)?$/

/**
 * Turns `<<Citation source>>` markers into markdown links with a `#citation:` href,
 * so the markdown renderer can show them as chips.
 * Drops a half-streamed marker at the end so raw `<<` never flashes on screen.
 */
export function parseCitations(content: string) {
  return content
    .replace(PARTIAL_CITATION, '')
    .replace(
      CITATION,
      (_, source: string) => ` [${escapeLinkText(source.trim())}](${CITATION_HREF_PREFIX}${encodeURIComponent(source.trim())})`,
    )
}

export function citationSource(href: string | undefined) {
  if (!href?.startsWith(CITATION_HREF_PREFIX)) return null
  return decodeURIComponent(href.slice(CITATION_HREF_PREFIX.length))
}

function escapeLinkText(text: string) {
  return text.replace(/[[\]\\]/g, '\\$&')
}
