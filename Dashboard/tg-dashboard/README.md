# TG Dashboard

A comprehensive personal productivity and financial management application built with React, TypeScript, Vite, and Supabase.

## Features

- **Tasks Hub**: Central task management with filtering and sync
- **Business Projects**: Hierarchical project tracking (Business → Project → Phase → Task)
- **Content Library**: URL-based content management with AI analysis
- **Finance Dashboard**: Personal finance tracking with balance snapshots
- **Daily Planning**: Todo lists, scheduling, and deep work tracking

## Tech Stack

- **Frontend**: React 19.1.1, TypeScript 5.9.3
- **Build Tool**: Vite 7.1.7
- **Backend/Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS 3.4.1
- **State Management**: React Query (@tanstack/react-query)

## Local Development Setup

### Prerequisites

- Node.js 20+ and npm
- Supabase account and project

### Step 1: Clone the Repository

```bash
git clone https://github.com/fullstackaiautomation/tgdashboard.git
cd tgdashboard
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Get your Supabase credentials:
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Select your project
   - Navigate to **Settings** → **API**

3. Fill in the `.env` file with your actual values:
   ```bash
   VITE_SUPABASE_PROJECT_ID="your-project-id"
   VITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-key-here"
   VITE_SUPABASE_URL="https://your-project-id.supabase.co"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-NEVER-IN-CLIENT-CODE"
   SUPABASE_DB_PASSWORD="your-database-password"
   ```

   **⚠️ SECURITY WARNING:**
   - Never commit the `.env` file (it's in `.gitignore` for safety)
   - Never use `SUPABASE_SERVICE_ROLE_KEY` in client code (bypasses RLS)
   - Rotate keys immediately if accidentally exposed

4. Copy the **Publishable key** (labeled "anon public") to `VITE_SUPABASE_PUBLISHABLE_KEY`
5. Copy the **URL** to `VITE_SUPABASE_URL`

### Step 4: Run the Development Server

```bash
npm run dev
```

The app will be available at [http://localhost:5000](http://localhost:5000)

### Troubleshooting

**"Invalid API key" error:**
- Verify your `.env` values match exactly what's in the Supabase Dashboard
- Make sure you're using the **Publishable key**, not the service role key
- Restart the dev server after changing `.env`: `npm run dev`

**"Missing Supabase environment variables" error:**
- Ensure `.env` file exists in the project root
- Check that variable names start with `VITE_` prefix (required by Vite)
- Verify no trailing spaces in your `.env` file

## Security

This project implements multiple security layers:

- ✅ **Pre-commit hooks**: Blocks commits containing secrets (powered by Husky)
- ✅ **GitHub Secret Scanning**: Detects secrets in repository
- ✅ **Automated security checks**: Runs on every deployment
- ✅ **Row Level Security (RLS)**: Database access controlled by policies

### Pre-commit Hook

A pre-commit hook automatically scans for secrets before allowing commits:
- Blocks `.env` files
- Detects API key patterns
- Checks for database connection strings
- Prevents private key commits

**To bypass (not recommended):** `git commit --no-verify`

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

## Documentation

- **Security Checklist**: `.ai/security-checklist.md`
- **Architecture**: `CLAUDE.md`
- **Finance Setup**: `FINANCE_SETUP_INSTRUCTIONS.md`

---

## React + Vite Template Info

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
