import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProjectGenerationRequest {
  description: string
  businessArea: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Check for API key
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not found in environment')
      throw new Error('API key not configured')
    }

    const { description, businessArea }: ProjectGenerationRequest = await req.json()

    console.log('Generating project structure for:', { description, businessArea })

    const prompt = `You are a project management expert. Based on the following project description, generate a comprehensive project structure with phases and tasks.

Project Description: ${description}
Business Area: ${businessArea}

Generate a project structure with:
1. A clear project name (concise, 3-5 words)
2. A brief project description (1-2 sentences)
3. 2-5 phases that represent major milestones
4. For each phase, create 3-8 specific, actionable tasks
5. Estimate hours for each task (be realistic: 1-40 hours per task)

Respond ONLY with valid JSON in this exact format:
{
  "projectName": "string",
  "projectDescription": "string",
  "phases": [
    {
      "name": "Phase Name",
      "description": "Phase description",
      "tasks": [
        {
          "name": "Task name",
          "description": "Task description",
          "hours_projected": number
        }
      ]
    }
  ]
}

Be specific and practical. Task names should be actionable (e.g., "Design user authentication flow", not "Authentication").`

    // Call Anthropic API using fetch
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Anthropic API error:', errorText)
      throw new Error(`Anthropic API error: ${response.status} ${errorText}`)
    }

    const anthropicResponse = await response.json()
    const responseText = anthropicResponse.content[0].text

    console.log('AI Response:', responseText)

    // Extract JSON from response (in case Claude adds explanatory text)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('Could not find JSON in response:', responseText)
      throw new Error('Failed to parse AI response - no JSON found')
    }

    const projectStructure = JSON.parse(jsonMatch[0])

    console.log('Generated project structure:', JSON.stringify(projectStructure, null, 2))

    return new Response(JSON.stringify(projectStructure), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error generating project:', error)

    // More detailed error response
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate project structure'
    const errorDetails = error instanceof Error ? error.stack : String(error)

    console.error('Error details:', errorDetails)

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: errorDetails
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
