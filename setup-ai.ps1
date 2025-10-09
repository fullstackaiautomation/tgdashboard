# AI Analyzer Setup Script for Windows PowerShell
# Run this script to set up the Anthropic Claude AI integration

Write-Host "🤖 TG Dashboard - AI Analyzer Setup" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
Write-Host "Checking for Supabase CLI..." -ForegroundColor Yellow
$supabaseInstalled = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabaseInstalled) {
    Write-Host "❌ Supabase CLI not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install Supabase CLI first:" -ForegroundColor Yellow
    Write-Host "  npm install -g supabase" -ForegroundColor White
    Write-Host ""
    Write-Host "Or using Scoop:" -ForegroundColor Yellow
    Write-Host "  scoop bucket add supabase https://github.com/supabase/scoop-bucket.git" -ForegroundColor White
    Write-Host "  scoop install supabase" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ Supabase CLI found" -ForegroundColor Green
Write-Host ""

# Prompt for API key
Write-Host "Enter your Anthropic API Key:" -ForegroundColor Yellow
Write-Host "(Get one from https://console.anthropic.com)" -ForegroundColor Gray
$apiKey = Read-Host "API Key"

if ([string]::IsNullOrWhiteSpace($apiKey)) {
    Write-Host "❌ API key is required!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Setting up..." -ForegroundColor Yellow
Write-Host ""

# Login to Supabase
Write-Host "Step 1: Logging into Supabase..." -ForegroundColor Cyan
supabase login

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to login to Supabase" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Logged in successfully" -ForegroundColor Green
Write-Host ""

# Link project
Write-Host "Step 2: Linking Supabase project..." -ForegroundColor Cyan
supabase link

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to link project" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Project linked" -ForegroundColor Green
Write-Host ""

# Set secret
Write-Host "Step 3: Setting API key secret..." -ForegroundColor Cyan
supabase secrets set ANTHROPIC_API_KEY=$apiKey

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to set secret" -ForegroundColor Red
    exit 1
}

Write-Host "✅ API key secret set" -ForegroundColor Green
Write-Host ""

# Deploy Edge Function
Write-Host "Step 4: Deploying Edge Function..." -ForegroundColor Cyan
supabase functions deploy analyze-content

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to deploy Edge Function" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Edge Function deployed" -ForegroundColor Green
Write-Host ""

# Success!
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Your AI analyzer is ready to use!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start your dev server: npm run dev" -ForegroundColor White
Write-Host "2. Open http://localhost:5002" -ForegroundColor White
Write-Host "3. Click 'Add Content' or 'Quick Add URL'" -ForegroundColor White
Write-Host "4. Enter a URL and click 'Analyze with AI' 🚀" -ForegroundColor White
Write-Host ""
Write-Host "Example URLs to try:" -ForegroundColor Gray
Write-Host "  - https://www.youtube.com/watch?v=dQw4w9WgXcQ" -ForegroundColor Gray
Write-Host "  - https://github.com/anthropics/anthropic-sdk-typescript" -ForegroundColor Gray
Write-Host "  - https://www.anthropic.com/news/claude-3-5-sonnet" -ForegroundColor Gray
Write-Host ""
Write-Host "Cost: ~$0.004 per URL analysis (less than half a cent!)" -ForegroundColor Gray
Write-Host ""
