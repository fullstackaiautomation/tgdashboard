/**
 * Tag Formatter Utility
 *
 * Ensures consistent tag formatting across the application:
 * - Removes hyphens and replaces with spaces
 * - Capitalizes first letter of each word
 * - Trims whitespace
 */

/**
 * Formats a single tag to proper format
 * Examples:
 * - "full-stack-ai" -> "Full Stack AI"
 * - "machine-learning" -> "Machine Learning"
 * - "ai" -> "AI"
 * - "claude-code" -> "Claude Code"
 */
export function formatTag(tag: string): string {
  if (!tag) return ''

  // Remove hyphens and replace with spaces
  const withoutHyphens = tag.replace(/-/g, ' ')

  // Trim and split into words
  const words = withoutHyphens.trim().split(/\s+/)

  // Capitalize each word
  const formatted = words.map(word => {
    if (!word) return ''

    // Special case: Keep common acronyms in uppercase
    const upperWord = word.toUpperCase()
    if (['AI', 'API', 'UI', 'UX', 'CEO', 'CTO', 'AWS', 'GCP', 'SQL', 'HTTP', 'HTTPS', 'REST', 'JSON', 'XML', 'HTML', 'CSS', 'JS', 'TS'].includes(upperWord)) {
      return upperWord
    }

    // Regular capitalization
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  }).join(' ')

  return formatted
}

/**
 * Formats an array of tags
 */
export function formatTags(tags: string[]): string[] {
  return tags.map(formatTag).filter(Boolean)
}

/**
 * Parses comma-separated tag input and formats it
 */
export function parseAndFormatTags(input: string): string[] {
  return input
    .split(',')
    .map(t => formatTag(t))
    .filter(Boolean)
}
