# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**tg-dashboard** is a comprehensive personal productivity and financial management application built with React, TypeScript, Vite, and Supabase. The application integrates 5 main modules: Daily planning, Tasks Hub, Business Projects, Content Library, and Finance tracking.

## Git Workflows - CRITICAL DISTINCTION

⚠️ **TWO SEPARATE REPOSITORIES - DO NOT CONFUSE THEM** ⚠️

### PUSH SYNC = tg-dashboard-sync (PRIVATE)
**Command**: User says "PUSH SYNC"
**Repository**: https://github.com/fullstackaiautomation/tg-dashboard-sync (Private)
**Branch**: master
**What to include**: ALL FILES including:
- ✅ .env (with secrets - SAFE because private)
- ✅ .gitignore
- ✅ All development files
- ✅ All notes and documentation
- ✅ Everything

**Action Steps**:
1. `git add .`
2. `git commit -m "describe changes"`
3. `git push origin master`

### PUSH LIVE = tgdashboard (PUBLIC)
**Command**: User says "PUSH LIVE"
**Repository**: https://github.com/fullstackaiautomation/tgdashboard (Public)
**Remote name in code**: `main` (also called `main-repo`)
**Branch**: master
**What to include**: ONLY production-ready code
- ✅ Built dist/ files
- ✅ Source code (src/)
- ✅ Configuration (package.json, tailwind.config.js, etc.)
- ✅ Public documentation
- ❌ .env (NEVER - contains secrets)
- ❌ .gitignore (NEVER - contains security rules)
- ❌ credentials.json
- ❌ Any files with API keys

**Action Steps**:
1. `npm run build` (creates dist/ folder)
2. `git add -f dist/` (force add, dist is in .gitignore)
3. `git commit -m "Add built dist files for..."`
4. `git push main master` (or `git push main master -f` if needed)
5. GitHub Actions workflow triggers automatically
6. Site deploys to https://tgdashboard.fullstackaiautomation.com

**CRITICAL**: Check for .env secrets before pushing to public. GitHub will block the push if secrets are detected.

### Why Two Repos?
- **tg-dashboard-sync (Private)**: Development work, all files, experimental code, secrets
- **tgdashboard (Public)**: Live production code, public documentation, no secrets, automatic deployment

## Context Management

**IMPORTANT**: Always warn about remaining context before starting a new task. Before initiating any new work:
1. **Assess remaining context tokens** - Estimate tokens left in the conversation window
2. **Evaluate task complexity** - Determine if remaining context is sufficient for the task
3. **If insufficient**: Ask the user to use the `compact` command or summarize/archive current work
4. **If sufficient**: Proceed with clear communication about context being used

## Note-Taking System

**Important**: Maintain three note files to track project progress:
- **[progress.md](progress.md)** - Update after every development session with completed tasks
- **[decisions.md](decisions.md)** - Log all architectural decisions made
- **[BUGS.md](BUGS.md)** - Document bugs encountered and solutions

See **[NOTES-README.md](NOTES-README.md)** for the complete note-taking system guide.

## Tech Stack

- **Frontend**: React 19.1.1, TypeScript 5.9.3
- **Build Tool**: Vite 7.1.7
- **Backend/Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS 3.4.1
- **AI Integration**: Anthropic Claude SDK (@anthropic-ai/sdk)
- **State Management**: React Query (@tanstack/react-query)
- **Drag & Drop**: @dnd-kit
- **Date Utilities**: date-fns

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on port 5000 by default)
npm run dev

# Build for production
npm run build

# Run ESLint
npm run lint

# Preview production build
npm preview
```

## Documentation Index

Detailed documentation is organized in the `docs/` directory:

### Core Documentation
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - App structure, tabs, components, and directory layout
- **[docs/DATABASE.md](docs/DATABASE.md)** - Database schema, tables, and migrations workflow
- **[docs/IMPLEMENTATION-GUIDE.md](docs/IMPLEMENTATION-GUIDE.md)** - Development workflow, patterns, and implementation details
- **[docs/SETUP.md](docs/SETUP.md)** - Environment configuration and dependency setup

### UI Component References
- **[docs/SHADCN-TABLE-REFERENCE.md](docs/SHADCN-TABLE-REFERENCE.md)** - Complete guide to shadcn/ui table components
- **[docs/SHADCN-TABLE-QUICK-START.md](docs/SHADCN-TABLE-QUICK-START.md)** - Quick reference for table implementation

### Standards & Guidelines
- **[docs/TIMEZONE-POLICY.md](docs/TIMEZONE-POLICY.md)** - **READ FIRST for any date/time work** - Complete timezone standards
- **[docs/TIMEZONE-AUDIT-REPORT.md](docs/TIMEZONE-AUDIT-REPORT.md)** - Full audit of date/time handling

## Quick Reference

**Default Development Server**: http://localhost:5000

**Main Entry Point**: `src/main.tsx` → `src/App.tsx`

**Supabase Client**: `src/lib/supabase.ts`

**Database Migrations**: `supabase/migrations/`

**Edge Functions**: `supabase/functions/`
