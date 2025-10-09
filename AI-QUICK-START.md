# AI Analyzer - Quick Start ⚡

## 🚀 Super Quick Setup (5 minutes)

### Option A: Automated Setup (Recommended)

```powershell
# Run the setup script
.\setup-ai.ps1
```

That's it! Follow the prompts.

---

### Option B: Manual Setup

```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Login and link project
supabase login
supabase link

# 3. Get your Anthropic API key from: https://console.anthropic.com
# Then set it as a secret:
supabase secrets set ANTHROPIC_API_KEY=your-key-here

# 4. Deploy the Edge Function
supabase functions deploy analyze-content

# 5. Done! Test it in your app
npm run dev
```

---

## 🎯 How to Use

1. Click **"Add Content"** or **"Quick Add URL"**
2. Enter any URL
3. Click the **purple "Analyze with AI"** button
4. Wait 2-3 seconds
5. Watch all fields auto-fill! ✨

---

## 💡 What Gets Analyzed?

✅ **Title** - Smart, concise title
✅ **AI Summary** - 2-3 sentence overview
✅ **Creator** - Author/channel name
✅ **Time Estimate** - Reading/watching time
✅ **Tags** - Relevant keywords
✅ **Value Rating** - 1-10 quality score

---

## 💰 Pricing

- **~$0.004 per URL** (less than half a cent!)
- 100 URLs = ~$0.40/month
- 500 URLs = ~$2.00/month
- First $5 often free credit

---

## 🔧 Troubleshooting

**Not working?**

Check logs:
```bash
supabase functions logs analyze-content --follow
```

Redeploy:
```bash
supabase functions deploy analyze-content
```

Reset API key:
```bash
supabase secrets set ANTHROPIC_API_KEY=your-new-key
```

---

## 📚 Need More Help?

See the full guide: [AI-SETUP-GUIDE.md](./AI-SETUP-GUIDE.md)

---

## ✅ You're All Set!

The AI will now:
- 🧠 Understand any URL you give it
- 📝 Write smart summaries
- 🏷️ Tag content automatically
- ⭐ Rate content value
- ⏱️ Estimate time to consume

**No more manual data entry!** 🎉
