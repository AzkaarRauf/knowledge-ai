// small local hast types, so we don't need @types/hast
type Text = { type: 'text'; value: string }
type Element = { type: 'element'; tagName: string; properties: Record<string, unknown>; children: Node[] }
type Node = Text | Element | { type: string; children?: Node[] }

const WORD_CLASS = 'animate-in fade-in duration-500 motion-reduce:animate-none'

/**
 * Rehype plugin: wraps each word in a span that fades in on mount.
 * React matches spans by position, so words already on screen stay mounted and only new words fade in.
 */
export function rehypeFadeInWords() {
  return (tree: Node) => walk(tree)
}

function walk(node: Node) {
  if (!('children' in node) || !node.children) return
  node.children = node.children.flatMap((child) => {
    if (child.type === 'text') return splitWords((child as Text).value)
    walk(child)
    return [child]
  })
}

function splitWords(value: string): Node[] {
  // keep whitespace as plain text so spacing and line breaks stay the same
  return value
    .split(/(\s+)/)
    .filter(Boolean)
    .map((part) =>
      /^\s+$/.test(part)
        ? { type: 'text', value: part }
        : {
            type: 'element',
            tagName: 'span',
            properties: { className: [WORD_CLASS] },
            children: [{ type: 'text', value: part }],
          },
    )
}
