# 8. Styling Guidelines

### Styling Approach

**Primary Method:** Tailwind CSS utility classes with CSS custom properties for theme variables.

**Component Styling Pattern:**

```typescript
// Basic component with Tailwind
export const TaskCard = ({ task }: TaskCardProps) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
      <h3 className="text-lg font-medium text-gray-100">{task.title}</h3>
      <p className="text-sm text-gray-400 mt-1">{task.description}</p>
    </div>
  );
};

// Dynamic business colors using CSS variables
export const BusinessCard = ({ business }: BusinessCardProps) => {
  return (
    <div
      className="rounded-lg p-6 border-2"
      style={{
        backgroundColor: `var(--color-business-${business.slug}-bg)`,
        borderColor: `var(--color-business-${business.slug})`
      }}
    >
      <h2 className="text-xl font-bold">{business.name}</h2>
    </div>
  );
};
```

### Global Theme Variables

```css
/* src/styles/theme.css */

:root {
  /* Base Colors - Dark Mode */
  --color-bg-primary: #1a1a1a;
  --color-bg-secondary: #1f2937;  /* gray-800 */
  --color-bg-tertiary: #374151;   /* gray-700 */

  --color-text-primary: #f3f4f6;  /* gray-100 */
  --color-text-secondary: #9ca3af; /* gray-400 */

  /* Brand Colors */
  --color-primary: #ff8c42;        /* Orange - Primary CTA */
  --color-primary-hover: #ff7a2e;

  /* Status Colors */
  --color-success: #10b981;        /* green-500 */
  --color-warning: #f59e0b;        /* yellow-500 */
  --color-error: #ef4444;          /* red-500 */

  /* Progress Gradient */
  --color-progress-low: #ef4444;   /* red: 0-33% */
  --color-progress-mid: #f59e0b;   /* yellow: 34-66% */
  --color-progress-high: #10b981;  /* green: 67-100% */

  /* Business Color Coding */
  --color-business-fullstack: #10b981;
  --color-business-fullstack-bg: rgba(16, 185, 129, 0.1);

  --color-business-hugecapital: #a855f7;
  --color-business-hugecapital-bg: rgba(168, 85, 247, 0.1);

  --color-business-s4: #3b82f6;
  --color-business-s4-bg: rgba(59, 130, 246, 0.1);

  --color-business-808: #f97316;
  --color-business-808-bg: rgba(249, 115, 22, 0.1);

  /* Life Area Colors */
  --color-area-health: #14b8a6;    /* Teal */
  --color-area-health-bg: rgba(20, 184, 166, 0.1);

  --color-area-personal: #ec4899;  /* Pink */
  --color-area-golf: #f97316;      /* Orange-red */
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 12px;
}

::-webkit-scrollbar-track {
  background: var(--color-bg-secondary);
}

::-webkit-scrollbar-thumb {
  background: var(--color-bg-tertiary);
  border-radius: 6px;
}

/* Focus Visible */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#ff8c42',
      },
    },
  },
};
```

### Common Patterns

**Cards:**
```tsx
<div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
```

**Buttons:**
```tsx
<button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
```

**Progress Bars:**
```tsx
<div className="w-full bg-gray-700 rounded-full h-2">
  <div className="bg-green-500 h-2 rounded-full" style={{ width: '65%' }} />
</div>
```

---
