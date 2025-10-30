/**
 * Script to fix tag formatting in existing content library entries
 * Removes hyphens and properly capitalizes all tags
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Formats a single tag to proper format
 */
function formatTag(tag: string): string {
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

async function fixTagsFormatting() {
  try {
    console.log('🔄 Starting tag formatting fix...')

    // Fetch all content items with tags
    const { data: contents, error: fetchError } = await supabase
      .from('content_library')
      .select('id, tags')
      .not('tags', 'is', null)

    if (fetchError) {
      console.error('Error fetching content:', fetchError)
      return
    }

    if (!contents || contents.length === 0) {
      console.log('No content items with tags found.')
      return
    }

    console.log(`📊 Found ${contents.length} content items with tags`)

    let updatedCount = 0
    let unchangedCount = 0

    for (const content of contents) {
      if (!content.tags || !Array.isArray(content.tags)) continue

      // Format the tags
      const formattedTags = content.tags.map(formatTag).filter(Boolean)

      // Check if tags actually changed
      const tagsChanged = JSON.stringify(content.tags) !== JSON.stringify(formattedTags)

      if (tagsChanged) {
        console.log(`📝 Updating content ${content.id}:`)
        console.log(`   Old: [${content.tags.join(', ')}]`)
        console.log(`   New: [${formattedTags.join(', ')}]`)

        const { error: updateError } = await supabase
          .from('content_library')
          .update({ tags: formattedTags })
          .eq('id', content.id)

        if (updateError) {
          console.error(`❌ Error updating content ${content.id}:`, updateError)
        } else {
          updatedCount++
        }
      } else {
        unchangedCount++
      }
    }

    console.log('\n✅ Tag formatting fix complete!')
    console.log(`   Updated: ${updatedCount} items`)
    console.log(`   Unchanged: ${unchangedCount} items`)

  } catch (error) {
    console.error('❌ Error fixing tags:', error)
  }
}

// Run the script
fixTagsFormatting()
