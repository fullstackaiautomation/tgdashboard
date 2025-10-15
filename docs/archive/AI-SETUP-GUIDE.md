# AI Analyzer Setup Guide 🤖

This guide will help you set up **real AI-powered content analysis** using Anthropic Claude API.

## 📋 Prerequisites

1. **Supabase CLI** installed
2. **Anthropic API Key** (sign up at https://console.anthropic.com)
3. **Supabase Project** (you already have this)

---

## 🚀 Step-by-Step Setup

### Step 1: Install Supabase CLI (if not already installed)

```bash
# Windows (using npm)
npm install -g supabase

# Or using Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Step 2: Get Your Anthropic API Key

1. Go to https://console.anthropic.com
2. Sign up or log in
3. Navigate to **API Keys**
4. Click **Create Key**
5. Copy your API key (starts with `sk-ant-...`)

**Pricing:** Claude API is pay-per-use. Typical costs:
- ~$0.003 per URL analysis (Claude 3.5 Sonnet)
- First $5 is often free credit

### Step 3: Login to Supabase CLI

```bash
# Login to Supabase
supabase login

# Link your project (you'll be prompted to select your project)
supabase link
```

### Step 4: Set Up Edge Function Secret

```bash
# Set your Anthropic API key as a secret
supabase secrets set ANTHROPIC_API_KEY=your-api-key-here
```

Replace `your-api-key-here` with your actual Anthropic API key.

### Step 5: Deploy the Edge Function

```bash
# Deploy the analyze-content function
supabase functions deploy analyze-content
```

This will deploy the Edge Function to your Supabase project.

### Step 6: Test the AI Analyzer

1. Start your dev server (if not already running):
   ```bash
   npm run dev
   ```

2. Open http://localhost:5002

3. Click **"Quick Add URL"** or **"Add Content"**

4. Enter a URL (try these examples):
   - `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
   - `https://github.com/anthropics/anthropic-sdk-typescript`
   - `https://medium.com/@yourfavoriteblog`

5. Click **"Analyze with AI"** (purple button)

6. Watch the magic happen! 🎉

---

## 🔧 Troubleshooting

### Error: "Edge function error"

**Check:**
1. Edge function is deployed: `supabase functions list`
2. API key is set: `supabase secrets list`
3. Check logs: `supabase functions logs analyze-content`

**Fix:**
```bash
# Redeploy
supabase functions deploy analyze-content

# Verify secrets
supabase secrets list
```

### Error: "AI analysis unavailable - using fallback"

This means the Edge Function isn't responding. The app will fall back to smart URL pattern detection.

**Check:**
1. Is the Edge Function deployed?
2. Is your Anthropic API key valid?
3. Do you have credits in your Anthropic account?

**View logs:**
```bash
supabase functions logs analyze-content --follow
```

### API Key Issues

If you get authentication errors:
```bash
# Unset and reset the secret
supabase secrets unset ANTHROPIC_API_KEY
supabase secrets set ANTHROPIC_API_KEY=your-new-key-here

# Redeploy
supabase functions deploy analyze-content
```

---

## 🎯 How It Works

```
User enters URL
    ↓
Frontend calls analyzeContentURL()
    ↓
Calls Supabase Edge Function
    ↓
Edge Function calls Anthropic Claude API
    ↓
Claude analyzes the URL and returns:
    - Title
    - AI Summary
    - Creator
    - Time Estimate
    - Tags
    - Value Rating
    ↓
Data returned to frontend
    ↓
Form auto-populated! ✨
```

---

## 💰 Cost Estimates

**Anthropic Claude Pricing (Claude 3.5 Sonnet):**
- Input: $3.00 per million tokens
- Output: $15.00 per million tokens

**Typical URL analysis:**
- ~500 input tokens (URL + prompt)
- ~200 output tokens (JSON response)
- **Cost per analysis: ~$0.004** (less than half a cent!)

**Monthly estimates:**
- 100 URLs/month = ~$0.40
- 500 URLs/month = ~$2.00
- 1000 URLs/month = ~$4.00

---

## 🔒 Security Notes

✅ **Good:**
- API key stored as Supabase secret (not in code)
- Edge Function runs server-side (key never exposed to browser)
- CORS properly configured

❌ **Don't:**
- Put API key in frontend code
- Commit API key to git
- Share your API key

---

## 🚀 Advanced: Local Development

To test the Edge Function locally:

```bash
# Start Supabase local development
supabase start

# Set local secret
supabase secrets set ANTHROPIC_API_KEY=your-key-here --local

# Serve function locally
supabase functions serve analyze-content

# Test with curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/analyze-content' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

---

## 📝 Files Created

1. **`supabase/functions/analyze-content/index.ts`** - Edge Function
2. **`src/services/aiContentAnalyzer.ts`** - Frontend service (updated)
3. **`AI-SETUP-GUIDE.md`** - This guide

---

## ✅ Verification Checklist

- [ ] Supabase CLI installed
- [ ] Anthropic API key obtained
- [ ] Logged into Supabase CLI
- [ ] Project linked
- [ ] API key set as secret
- [ ] Edge Function deployed
- [ ] Tested with a real URL
- [ ] AI analysis working!

---

## 🎉 Success!

Once deployed, every time you click **"Analyze with AI"**, Claude will:
- 🔍 Understand the URL
- 📝 Generate a smart summary
- 🏷️ Suggest relevant tags
- ⭐ Rate the content value
- ⏱️ Estimate reading/watching time
- 👤 Extract creator info

All automatically! No more manual data entry! 🚀
