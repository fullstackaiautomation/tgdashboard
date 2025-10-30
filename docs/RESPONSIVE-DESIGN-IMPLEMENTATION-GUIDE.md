# Responsive Design Implementation Guide

**For Developers Creating New Pages**

**Referenced Documents:**
- [Responsive Design Audit & Standards](../RESPONSIVE-DESIGN-AUDIT.md)
- [Architectural Decision D-003](../decisions.md) - Responsive Design System Standardization

---

## Quick Start Checklist

When creating a new page or component, follow these steps:

### Step 1: Choose Your Layout
- [ ] Single column (mobile-first)
- [ ] Two-column layout (page with sidebar/panel)
- [ ] Three-column layout (advanced)
- [ ] Card grid (multiple items)

### Step 2: Add Responsive Classes

**For page wrapper:**
```tsx
<div className="min-h-screen bg-gray-950 text-gray-100 p-4 sm:p-6 md:p-8 lg:p-10">
  {/* Your page content */}
</div>
```

**For two-column layout (Tasks + Schedule example):**
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
  <div className="min-w-0">
    {/* Left column - constrain width to prevent overflow */}
  </div>
  <div className="min-w-0">
    {/* Right column */}
  </div>
</div>
```

**For card grids:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
  {/* Cards */}
</div>
```

### Step 3: Scale Typography
Use responsive text sizing:

```tsx
// Page title
<h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Title</h1>

// Section heading
<h2 className="text-xl sm:text-2xl md:text-3xl font-bold">Section</h2>

// Card title
<h3 className="text-lg md:text-xl font-semibold">Card Title</h3>

// Body text
<p className="text-base md:text-lg text-gray-400">Content</p>

// Label (stays small)
<span className="text-sm text-gray-500">Label</span>
```

### Step 4: Test Responsiveness

Test on these viewport widths:
- ✅ 1496px (MacBook) - Check proportions
- ✅ 1920px (Standard monitor) - Reference baseline
- ✅ 2560px (4K monitor) - Should not expand infinitely

**What to verify:**
- [ ] Text is readable
- [ ] Columns are proportional
- [ ] No horizontal scrolling
- [ ] Spacing feels right (not cramped, not spread out)
- [ ] Images scale appropriately

---

## Responsive Breakpoints Reference

Available Tailwind breakpoints (defined in `tailwind.config.js`):

| Prefix | Min Width | Use Case |
|--------|-----------|----------|
| *(none)* | 0px | Default (mobile) |
| `sm:` | 640px | Small tablets |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Laptops |
| `xl:` | 1280px | Desktop |
| `2xl:` | 1536px | Large desktop |
| `3xl:` | 1920px | HD monitors |
| `4xl:` | 2560px | 4K monitors |

---

## Spacing Standards

Use these gap values in responsive manner:

```
Mobile (default):    gap-4     (16px)
Tablet (md+):        gap-6     (24px)
Desktop (lg+):       gap-8     (32px)
```

Example:
```tsx
<div className="grid gap-4 md:gap-6 lg:gap-8">
  {/* Content scales with viewport */}
</div>
```

---

## Common Patterns

### Pattern 1: Two-Column Layout
**Best for:** Task/Schedule, Form/Preview, List/Detail

```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <div className="min-w-0">
    {/* Left content - constrained to prevent overflow */}
  </div>
  <div className="min-w-0">
    {/* Right content */}
  </div>
</div>
```

**Why `min-w-0`?** Prevents grid items from overflowing when they contain long content.

---

### Pattern 2: Three-Column Grid (60/40 ratio)
**Best for:** Dashboard cards with main + sidebars

```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">
    {/* Main content - 66% width */}
  </div>
  <div className="lg:col-span-1">
    {/* Sidebar - 33% width */}
  </div>
</div>
```

---

### Pattern 3: Card Grid
**Best for:** Content library, project cards, task lists

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
  {items.map(item => (
    <div key={item.id} className="bg-gray-800 rounded-lg p-4 md:p-6">
      {/* Card content */}
    </div>
  ))}
</div>
```

---

### Pattern 4: Page Container with Max-Width
**Best for:** Preventing content from expanding infinitely on 4K monitors

```tsx
<div className="w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
  {/* Page content */}
</div>
```

Alternatively, use the new container class:
```tsx
<div className="container-page">
  {/* Page content - handles max-width and padding automatically */}
</div>
```

---

## Responsive Component Template

```tsx
import { FC } from 'react';

interface MyComponentProps {
  title: string;
  data: any[];
}

export const MyComponent: FC<MyComponentProps> = ({ title, data }) => {
  return (
    // Responsive page padding: 16px mobile → 32px tablet → 40px desktop
    <div className="p-4 sm:p-6 md:p-8 lg:p-10">

      {/* Responsive heading */}
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6">
        {title}
      </h1>

      {/* Two-column layout: 1 column mobile, 2 columns on lg+ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8">

        {/* Left column */}
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4">
            Left Column
          </h2>
          <div className="space-y-3">
            {/* Content */}
          </div>
        </div>

        {/* Right column */}
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4">
            Right Column
          </h2>
          <div className="space-y-3">
            {/* Content */}
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

## CSS Utility Classes (Advanced)

If you need more control, use the responsive utility classes defined in `src/styles/containers.css`:

```tsx
// Responsive padding
<div className="section-padding">Content</div>

// Responsive card padding
<div className="card-padding">Content</div>

// Two-column layout helper
<div className="layout-two-column">
  <div>Left</div>
  <div>Right</div>
</div>

// Responsive text sizing
<h1 className="text-responsive-h1">Heading</h1>
<h2 className="text-responsive-h2">Subheading</h2>
<p className="text-responsive-body">Body text</p>
```

---

## Troubleshooting

### Issue: Content overflows horizontally
**Solution:** Add `min-w-0` to grid items
```tsx
<div className="grid grid-cols-2 gap-4">
  <div className="min-w-0">Content</div>  {/* Fix overflow */}
  <div className="min-w-0">Content</div>
</div>
```

### Issue: Content too wide on large monitors
**Solution:** Add max-width constraint
```tsx
<div className="w-full max-w-6xl mx-auto">
  {/* Content stays at max-width, centered */}
</div>
```

### Issue: Text too small/large on some screens
**Solution:** Use responsive text sizing
```tsx
// Good
<h1 className="text-xl sm:text-2xl md:text-3xl">Title</h1>

// Avoid
<h1 className="text-3xl">Title</h1>  {/* Too large on mobile */}
```

### Issue: Gaps/spacing looks wrong
**Solution:** Use responsive gap classes
```tsx
// Good
<div className="gap-4 md:gap-6 lg:gap-8">

// Avoid
<div className="gap-8">  {/* Too large on mobile */}
```

---

## References

- **Tailwind Responsive Design**: https://tailwindcss.com/docs/responsive-design
- **CSS Grid Responsive**: https://web.dev/responsive-web-design-basics/
- **Full Standards**: [RESPONSIVE-DESIGN-AUDIT.md](../RESPONSIVE-DESIGN-AUDIT.md)
- **Architectural Decision**: [decisions.md - D-003](../decisions.md)

---

## Questions?

Refer to:
1. [RESPONSIVE-DESIGN-AUDIT.md](../RESPONSIVE-DESIGN-AUDIT.md) - Detailed standards
2. [Existing components](../../src/components/) - Look at similar components for patterns
3. Test on your monitor (1920px) and different sizes (1496px, 2560px)

