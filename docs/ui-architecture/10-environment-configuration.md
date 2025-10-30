# 10. Environment Configuration

### Environment Variables

```bash
# .env.example (Safe to commit)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_APP_NAME=TG Dashboard
VITE_APP_URL=https://tgdashboard.fullstackaiautomation.com
VITE_ENV=development
```

```bash
# .env.local (NEVER commit - gitignored)
VITE_SUPABASE_URL=https://xyzcompany.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_URL=http://localhost:5173
VITE_ENV=development
VITE_ENABLE_DEBUG_TOOLS=true
```

### Type-Safe Configuration

```typescript
// src/config/env.ts
interface EnvConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  app: {
    name: string;
    url: string;
    env: 'development' | 'staging' | 'production';
  };
}

function getEnvVar(key: string): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env: EnvConfig = {
  supabase: {
    url: getEnvVar('VITE_SUPABASE_URL'),
    anonKey: getEnvVar('VITE_SUPABASE_ANON_KEY'),
  },
  app: {
    name: getEnvVar('VITE_APP_NAME'),
    url: getEnvVar('VITE_APP_URL'),
    env: getEnvVar('VITE_ENV') as 'development' | 'production',
  },
};

export const isDevelopment = env.app.env === 'development';
export const isProduction = env.app.env === 'production';
```

### GitHub Actions Deployment

```yaml
# .github/workflows/deploy.yml
- name: Build with environment variables
  env:
    VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
    VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
    VITE_ENV: "production"
  run: npm run build
```

### Security Best Practices

**✅ Safe to Expose (Client Bundle):**
- Supabase URL
- Supabase anon key (protected by RLS)
- API URLs
- Feature flags

**❌ NEVER Expose:**
- Supabase service_role key (bypasses RLS)
- Private API keys
- Database credentials
- Passwords

**Pre-Deployment Checklist:**
- ✅ No `service_role` in src/: `grep -r "service_role" src/`
- ✅ `.env.local` in `.gitignore`
- ✅ GitHub Secrets configured
- ✅ Production build inspection: `cat dist/assets/*.js | grep -i "service"`

---
