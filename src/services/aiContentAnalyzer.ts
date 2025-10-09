/**
 * AI Content Analyzer Service
 *
 * Analyzes URLs using Anthropic Claude API via Supabase Edge Function
 *
 * Extracts:
 * - Title
 * - AI Summary
 * - Creator/Author
 * - Time to consume estimate
 * - Suggested tags
 * - Dashboard areas (business context)
 * - Value rating
 */

import { supabase } from '../lib/supabase'

export interface AIAnalysisResult {
  title: string
  ai_summary: string
  creator?: string
  time_estimate?: string
  tags?: string[]
  dashboard_areas?: string[]
  value_rating?: number
  thumbnail_url?: string
}

/**
 * Analyzes a URL using Anthropic Claude API
 * Calls Supabase Edge Function for secure API key handling
 */
export async function analyzeContentURL(url: string): Promise<AIAnalysisResult> {
  try {
    console.log('🤖 AI Analyzer: Starting analysis for:', url)

    // Get auth session for authorization header
    const { data: { session } } = await supabase.auth.getSession()
    console.log('🔑 Auth session:', session ? 'Found' : 'Not found')

    // Call Supabase Edge Function with auth
    console.log('📡 Calling Edge Function: analyze-content')
    const { data, error } = await supabase.functions.invoke('analyze-content', {
      body: { url },
      headers: session?.access_token ? {
        Authorization: `Bearer ${session.access_token}`
      } : {}
    })

    if (error) {
      console.error('❌ Edge function error:', error)
      console.log('⚠️ Falling back to placeholder logic')
      // Fall back to placeholder logic
      return getFallbackAnalysis(url)
    }

    console.log('✅ AI Analysis successful:', data)

    // Return AI-analyzed data
    return {
      title: data.title || 'Untitled Content',
      ai_summary: data.ai_summary || 'No summary available',
      creator: data.creator,
      time_estimate: data.time_estimate,
      tags: data.tags || [],
      dashboard_areas: data.dashboard_areas || [],
      value_rating: data.value_rating,
      thumbnail_url: data.thumbnail_url,
    }
  } catch (error) {
    console.error('❌ Error calling AI analyzer:', error)
    console.log('⚠️ Falling back to placeholder logic')
    // Fall back to placeholder logic
    return getFallbackAnalysis(url)
  }
}

/**
 * Fallback analysis when Edge Function is unavailable
 * Uses smart URL pattern detection
 */
function getFallbackAnalysis(url: string): AIAnalysisResult {
  let domain = ''
  try {
    const urlObj = new URL(url)
    domain = urlObj.hostname.replace('www.', '')
  } catch {
    domain = 'unknown'
  }

  const result: AIAnalysisResult = {
    title: `Content from ${domain}`,
    ai_summary: `Content from ${domain}. AI analysis unavailable - using fallback. Deploy the Supabase Edge Function for full AI analysis.`,
    creator: undefined,
    time_estimate: undefined,
    tags: [],
    dashboard_areas: [],
    value_rating: undefined,
    thumbnail_url: undefined,
  }

  // Add domain-specific intelligence
  if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
    result.creator = 'YouTube Creator'
    result.time_estimate = '15 min'
    result.tags = ['video', 'tutorial']
    result.value_rating = 7
  } else if (domain.includes('twitter.com') || domain.includes('x.com')) {
    result.creator = 'Twitter User'
    result.time_estimate = '2 min'
    result.tags = ['social', 'quick-read']
    result.value_rating = 5
  } else if (domain.includes('medium.com') || domain.includes('dev.to')) {
    result.creator = 'Blog Author'
    result.time_estimate = '8 min'
    result.tags = ['article', 'technical']
    result.value_rating = 7
  } else if (domain.includes('github.com')) {
    result.creator = 'GitHub Repository'
    result.time_estimate = '30 min'
    result.tags = ['code', 'repository']
    result.value_rating = 8
  }

  return result
}

/**
 * Re-analyzes existing content with AI
 * Used for "Analyze with AI" button in edit modal
 */
export async function reanalyzeContent(url: string, existingData?: Partial<AIAnalysisResult>): Promise<AIAnalysisResult> {
  const freshAnalysis = await analyzeContentURL(url)

  // Merge with existing data, preferring new analysis but keeping user customizations
  return {
    ...existingData,
    ...freshAnalysis,
  }
}

/**
 * Extracts thumbnail from URL
 *
 * TODO: Implement Open Graph scraping or screenshot service
 */
export async function extractThumbnail(_url: string): Promise<string | undefined> {
  // TODO: Implement thumbnail extraction
  // Options:
  // 1. Open Graph meta tags scraping
  // 2. Screenshot service (Puppeteer, Playwright)
  // 3. Third-party API (LinkPreview, Microlink)

  return undefined
}
