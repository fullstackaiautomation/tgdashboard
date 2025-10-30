# Setup & Environment Configuration

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the project root with the following variables:

```
VITE_SUPABASE_PROJECT_ID=your_project_id
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_DB_PASSWORD=your_db_password
```

### Where to Find These Values

1. **Login to Supabase Dashboard**
   - Go to your project
   - Navigate to **Settings** → **API**

2. **Copy these values**:
   - `VITE_SUPABASE_PROJECT_ID` - Project ID (visible in URL or settings)
   - `VITE_SUPABASE_PUBLISHABLE_KEY` - Anon key
   - `VITE_SUPABASE_URL` - API URL

3. **Service Role Key** (for backend operations):
   - Found in **Settings** → **API** → **Service Role Key**
   - ⚠️ Keep this secret - never commit to version control

4. **Database Password**:
   - Set during project creation
   - Available in **Settings** → **Database**

## Supabase Secrets (for Edge Functions)

For Edge Functions that use external APIs:

```bash
supabase secrets set ANTHROPIC_API_KEY=your_anthropic_key
```

**To get your Anthropic API Key**:
1. Go to https://console.anthropic.com/
2. Create an API key
3. Set it in Supabase secrets

## Project Dependencies

### Core Dependencies

```json
{
  "react": "^19.1.1",
  "react-dom": "^19.1.1",
  "typescript": "^5.9.3",
  "@tanstack/react-query": "^5.x.x",
  "@supabase/supabase-js": "^2.x.x"
}
```

### UI & Styling

```json
{
  "tailwindcss": "^3.4.1",
  "react-icons": "^latest"
}
```

### Date/Time Utilities

```json
{
  "date-fns": "^latest"
}
```

### Drag & Drop

```json
{
  "@dnd-kit/core": "^latest",
  "@dnd-kit/sortable": "^latest",
  "@dnd-kit/utilities": "^latest"
}
```

### AI Integration

```json
{
  "@anthropic-ai/sdk": "^latest"
}
```

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd tg-dashboard
```

### 2. Install Dependencies

```bash
npm install
```

This installs all packages listed in `package.json`.

### 3. Configure Environment

Create `.env` file in the root directory (see Environment Configuration above).

### 4. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:5000` (or auto-increment if port is in use).

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on port 5000 by default)
npm run dev

# Build for production
npm run build

# Run ESLint for code quality
npm run lint

# Preview production build locally
npm preview
```

## Supabase Local Development

### Setup Local Supabase

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Start local Supabase instance
supabase start
```

This creates a local PostgreSQL database with Supabase emulator.

### Apply Migrations

```bash
# Push migrations to local database
supabase db push
```

### Reset Local Database

```bash
# Reset database to initial state (⚠️ destructive)
supabase db reset
```

### View Local Database

Supabase provides a local UI:
- **URL**: http://localhost:54323 (check terminal output)
- View tables, data, and run SQL queries

## Common Setup Issues

### Port Already in Use

**Issue**: Dev server won't start on port 5000

**Solution**: Vite auto-increments: 5000 → 5001 → 5002, etc.

```bash
# Check which process uses port 5000
netstat -ano | findstr :5000

# Or just let Vite auto-increment
npm run dev  # Will use next available port
```

### Database Connection Failed

**Issue**: Can't connect to Supabase database

**Checklist**:
1. Verify `.env` variables are correct
2. Check Supabase project is active
3. Ensure IP whitelist includes your IP (Settings → Database)
4. Test with: `supabase status` (if using local Supabase)

### Missing Dependencies

**Issue**: Module not found errors

**Solution**:
```bash
# Clean install
rm node_modules package-lock.json
npm install
```

### TypeScript Errors

**Issue**: Type definition errors on startup

**Solution**:
```bash
# Check TypeScript configuration
npx tsc --noEmit

# Install missing types
npm install --save-dev @types/node
```

## Editor Configuration

### VS Code Recommended Extensions

- **ES7+ React/Redux/React-Native snippets** (dsznajder)
- **ESLint** (Microsoft)
- **Prettier** (Prettier)
- **Tailwind CSS IntelliSense** (Tailwind Labs)
- **TypeScript Vue Plugin** (Vue)

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

## Deployment Checklist

Before deploying to production:

1. **Environment**:
   - [ ] Use production Supabase project
   - [ ] Set all required `.env` variables
   - [ ] Store secrets in secure environment (never in .env)

2. **Code Quality**:
   - [ ] Run `npm run lint` - no errors
   - [ ] Run `npm run build` - builds successfully
   - [ ] Run tests (if applicable)

3. **Database**:
   - [ ] All migrations applied
   - [ ] Edge functions deployed
   - [ ] RLS policies configured for security

4. **Security**:
   - [ ] Remove hardcoded credentials from `App.tsx`
   - [ ] Implement proper authentication flow
   - [ ] Enable CORS headers appropriately
   - [ ] Set strong database password

5. **Performance**:
   - [ ] Production build optimized
   - [ ] Images compressed and optimized
   - [ ] Check bundle size

## Additional Resources

- **Supabase Docs**: https://supabase.com/docs
- **React Docs**: https://react.dev
- **TypeScript Docs**: https://www.typescriptlang.org/docs
- **Vite Docs**: https://vitejs.dev
- **Tailwind CSS**: https://tailwindcss.com/docs
