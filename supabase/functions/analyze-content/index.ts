// Supabase Edge Function: analyze-content
// Analyzes URLs using Anthropic Claude API

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }

    // Fetch actual content using Jina AI Reader (FREE)
    let scrapedContent = ''
    let contentTitle = ''
    let contentCreator = ''

    try {
      console.log('Fetching content with Jina AI Reader:', url)
      const jinaResponse = await fetch(`https://r.jina.ai/${url}`, {
        headers: {
          'Accept': 'application/json',
          'X-Return-Format': 'markdown'
        }
      })

      if (jinaResponse.ok) {
        const jinaData = await jinaResponse.json()
        console.log('Jina AI response:', jinaData)

        scrapedContent = jinaData.data?.content || jinaData.content || ''
        contentTitle = jinaData.data?.title || jinaData.title || ''
        contentCreator = jinaData.data?.author || jinaData.author || ''

        // Clean up Twitter/X content
        if (url.includes('twitter.com') || url.includes('x.com')) {
          // Clean up title - remove "on X:" suffix
          contentTitle = contentTitle.replace(/\s+on X:?\s*$/i, '').trim()
          const onXMatch = contentTitle.match(/^(.+?)\s+on X:/i)
          if (onXMatch) {
            contentTitle = onXMatch[1].trim()
          }

          // Clean up creator - remove @ symbol
          contentCreator = contentCreator.replace(/^@+/, '').trim()
        }

        console.log('Scraped - Title:', contentTitle, 'Content length:', scrapedContent.length, 'Creator:', contentCreator)
      }
    } catch (error) {
      console.error('Jina AI scraping failed (non-fatal):', error)
      // Continue without scraped content
    }

    // Call Anthropic API directly using fetch
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `Analyze this content from: ${url}

${scrapedContent ? `
Content:
${scrapedContent.substring(0, 3000)}
${contentTitle ? `\nTitle: ${contentTitle}` : ''}
${contentCreator ? `\nCreator: ${contentCreator}` : ''}
` : 'No content available - analyze based on URL only.'}

Please provide a JSON response with the following fields:
- title: ${url.includes('youtube.com') || url.includes('youtu.be') ? `Use the original title exactly: "${contentTitle}"` : 'Create a concise 5-8 word title that summarizes the MAIN TOPIC or KEY INSIGHT of the content. Make it descriptive and specific about what the content teaches or discusses. DO NOT just copy the original title - create a NEW title that captures the essence.'}
- ai_summary: A concise bullet-point summary with 3-5 key takeaways or main points from the content. Format as markdown with bullet points (•). ${scrapedContent ? 'Base this on the actual content above.' : ''}
- creator: ${contentCreator ? `Use "${contentCreator}"` : 'The author/creator (guess from URL if needed)'}
- time_estimate: Estimated time to consume (e.g., "5 min", "15 min", "1 hour")
- tags: Array of 2-4 relevant tags based on the content
- value_rating: A 1-10 rating of how valuable/interesting this content seems

${url.includes('youtube.com') || url.includes('youtu.be') ? '' : 'Example title: "Building SaaS Through Organic YouTube Content"'}
Example ai_summary format:
"• First key point about the content
• Second important takeaway
• Third notable insight"

Return ONLY valid JSON, no markdown code blocks or explanations.`
          }
        ]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Anthropic API error:', errorText)
      throw new Error(`Anthropic API returned ${response.status}: ${errorText}`)
    }

    const result = await response.json()

    // Parse Claude's response
    const responseText = result.content && result.content[0] && result.content[0].text
      ? result.content[0].text
      : '{}'

    console.log('Claude response:', responseText)

    // Try to extract JSON from response (Claude might wrap it in markdown)
    let jsonMatch = responseText.match(/\{[\s\S]*\}/)
    const analysisData = jsonMatch ? JSON.parse(jsonMatch[0]) : {}

    // Format tags to remove hyphens and properly capitalize
    if (analysisData.tags && Array.isArray(analysisData.tags)) {
      analysisData.tags = analysisData.tags.map((tag: string) => {
        // Remove hyphens and replace with spaces
        const withoutHyphens = tag.replace(/-/g, ' ')
        // Capitalize each word
        const words = withoutHyphens.trim().split(/\s+/)
        const formatted = words.map(word => {
          if (!word) return ''
          // Keep common acronyms uppercase
          const upperWord = word.toUpperCase()
          if (['AI', 'API', 'UI', 'UX', 'CEO', 'CTO', 'AWS', 'GCP', 'SQL', 'HTTP', 'HTTPS', 'REST', 'JSON', 'XML', 'HTML', 'CSS', 'JS', 'TS'].includes(upperWord)) {
            return upperWord
          }
          // Regular capitalization
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        }).join(' ')
        return formatted
      }).filter((tag: string) => tag)
    }

    return new Response(
      JSON.stringify(analysisData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error analyzing content:', error)
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to analyze content',
        title: 'Error analyzing content',
        ai_summary: 'Unable to analyze this URL. Please try again or enter details manually.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
