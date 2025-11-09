# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**tg-dashboard** is a comprehensive personal productivity and financial management application built with React, TypeScript, Vite, and Supabase. The application integrates 5 main modules: Daily planning, Tasks Hub, Business Projects, Content Library, and Finance tracking.

## Git Workflow

**Repository**: https://github.com/fullstackaiautomation/tgdashboard (Public)
**Remote name**: `origin`
**Branch**: main

### Standard Push Workflow

**What to include**:
- ✅ Source code (src/)
- ✅ Configuration (package.json, tailwind.config.js, etc.)
- ✅ Public documentation
- ✅ `public/.nojekyll` marker (prevents Jekyll processing)
- ❌ `dist/` (GitHub Actions builds this now)
- ❌ .env (NEVER - contains secrets)
- ❌ .gitignore (should not be committed)
- ❌ credentials.json or any API keys

**Action Steps**:
1. Run quality gates locally (at minimum `npm run typecheck` and `npm run build`).
2. Stage only source/config/docs changes: `git add <files>` (do **not** force-add `dist/`).
3. Commit with a descriptive message.
4. Push to GitHub: `git push origin main`.
5. Monitor the **Deploy to GitHub Pages** workflow in GitHub Actions until both *build* and *deploy* jobs succeed.
6. Confirm the follow-on **pages build and deployment** summary job completes and the site updates at https://tgdashboard.fullstackaiautomation.com.

**CRITICAL**: Never push directly to the `gh-pages` branch. GitHub Actions builds from `main` and publishes the artifact automatically. Cancel any stuck older runs before re-triggering a deploy.

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
