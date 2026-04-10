---
name: skyport-ui-design
description: "Activate when designing, building, or modifying any Skyport panel UI — pages, cards, lists, forms, dialogs, or layout structures. Covers component selection, spacing, color usage, card patterns, icon treatment, responsive grids, and the overall visual language. Use whenever creating new pages, redesigning existing ones, or reviewing UI code for consistency."
license: MIT
metadata:
  author: skyport
---

# Skyport UI Design System

## When to Apply

Activate this skill when:

- Creating new pages or sections in the panel
- Designing cards, lists, tables, or form layouts
- Choosing components, spacing, or color patterns
- Reviewing UI code for visual consistency
- Building responsive layouts for server or admin pages

## Core Visual Language

Skyport uses a dark-first, minimal UI with layered card surfaces, hatched pattern accents, and compact icon-driven actions. Every element should feel purposeful — no decorative filler.

### Design Principles

1. **Layered surfaces** — Content sits inside nested rounded containers that create subtle depth: `bg-sidebar p-1 > border border-sidebar-accent bg-background p-6`.
2. **Hatched pattern accents** — The `<PlaceholderPattern>` SVG component adds a crosshatch texture to icon boxes, empty states, and decorative surfaces. It is a signature visual element.
3. **Compact icon actions** — Prefer icon-only buttons with tooltips over text buttons for row-level actions (copy, delete, edit, star). Use `variant="ghost" size="icon" className="h-8 w-8"`.
4. **Subdued chrome** — Borders use `border-border/70` or `border-sidebar-accent`. Backgrounds use `bg-muted/20` for cards. Avoid high-contrast outlines.
5. **Information hierarchy** — Primary value in `text-sm font-medium text-foreground`, secondary info in `text-xs text-muted-foreground` below it.

## Page Structure

### Standard Page Layout

Every page inside the server or admin context follows this structure:

```tsx
<AppLayout breadcrumbs={breadcrumbs}>
    <Head title="..." />
    <div className="px-4 py-6">
        <Heading title="Page Title" description="Short description." />
        {/* Page content */}
    </div>
</AppLayout>
```

Admin pages additionally wrap content in `<AdminLayout>`:

```tsx
<AdminLayout title="Settings" description="Manage system settings.">
    {/* Admin content */}
</AdminLayout>
```

### Section Cards (Settings Pattern)

Used for forms, settings panels, and grouped content. The outer `bg-sidebar p-1` wrapper creates the layered depth effect:

```tsx
<div className="rounded-md bg-sidebar p-1">
    <div className="rounded-md border border-sidebar-accent bg-background p-6">
        <Heading variant="small" title="Section Title" description="Explanation." />
        <div className="mt-6 max-w-md space-y-4">
            {/* Form fields or content */}
        </div>
    </div>
</div>
```

When a section has a toggle (like enable/disable), place it beside the heading:

```tsx
<div className="flex items-center justify-between">
    <Heading variant="small" title="Feature" description="Description." />
    <Switch checked={enabled} onCheckedChange={setEnabled} />
</div>
```

### Tabbed Pages

Use `<SlidingTabs>` for pages with multiple sections. Each tab renders its own form or content block:

```tsx
const pageTabs: Tab[] = [
    { id: 'general', label: 'General' },
    { id: 'startup', label: 'Startup' },
];

<SlidingTabs tabs={pageTabs} active={tab} onChange={setTab} />
```

## Component Patterns

### Item Cards (Meta/List Pattern)

For displaying items like allocations, server metadata, or resources. Uses the hatched icon box:

```tsx
<div className="group relative flex items-center gap-3 rounded-xl border border-border/70 bg-muted/20 px-1 py-1">
    {/* Hatched icon box */}
    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-background text-muted-foreground shadow-xs ring-1 ring-border/60">
        <PlaceholderPattern
            patternSize={4}
            className="pointer-events-none absolute inset-0 size-full stroke-current opacity-[0.12]"
        />
        <IconComponent className="relative h-4 w-4" />
    </div>
    {/* Text content */}
    <div className="min-w-0 flex-1 pl-2">
        <p className="text-sm font-medium text-foreground">Primary value</p>
        <p className="text-xs text-muted-foreground">Secondary detail</p>
    </div>
    {/* Actions */}
    <div className="flex items-center gap-1 pr-2">
        <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                    <ActionIcon className="h-3.5 w-3.5" />
                </Button>
            </TooltipTrigger>
            <TooltipContent>Action label</TooltipContent>
        </Tooltip>
    </div>
</div>
```

These cards work best in responsive grids: `grid gap-2 sm:grid-cols-2` or `grid gap-3 sm:grid-cols-2 xl:grid-cols-3`.

### Stat Cards

For dashboard-style number displays:

```tsx
<div className="flex h-full flex-col gap-1 rounded-md bg-sidebar p-1">
    <div className="rounded-md border border-sidebar-accent bg-background p-4">
        <span className="text-xs text-muted-foreground">Label</span>
        <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
        <span className="text-xs text-muted-foreground">Subtitle</span>
    </div>
</div>
```

### Chart Cards

For resource usage or time-series data, cards have a background chart with a gradient fade:

```tsx
<div className="relative flex h-full flex-col gap-1 rounded-md bg-sidebar p-1">
    <div className="relative flex aspect-16/7 flex-col justify-between overflow-hidden rounded-md border border-sidebar-accent bg-background p-4">
        <div className="absolute inset-x-0 bottom-0 z-10 h-1/3 bg-linear-to-t from-background to-transparent" />
        {/* Chart in bottom half */}
        <div className="absolute inset-x-0 bottom-0 h-2/4">
            <ResponsiveContainer>...</ResponsiveContainer>
        </div>
        {/* Title overlay */}
        <div className="relative">
            <h2 className="text-md font-semibold tracking-tight">{title}</h2>
            <span className="text-xs text-muted-foreground">{subtitle}</span>
        </div>
        <span className="relative z-20 text-sm font-semibold">{value}</span>
    </div>
</div>
```

The primary chart color is `#d92400` (Skyport orange-red).

### Inline Status Badges

For small status indicators like "Primary", "Online", etc., use subtle pill badges rather than the `<Badge>` component:

```tsx
<span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
    <Star className="h-2.5 w-2.5 fill-current" />
    Primary
</span>
```

### Destructive Actions

Always wrap destructive actions (delete, remove) in an `<AlertDialog>` for confirmation. The trigger should be a ghost icon button with `hover:text-destructive`:

```tsx
<Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
    <Trash2 className="h-3.5 w-3.5" />
</Button>
```

### Forms

- Wrap form sections in the section card pattern above.
- Use `max-w-md` or `max-w-xl` to constrain form width.
- Always include `<InputError message={form.errors.field} />` below inputs.
- Save buttons use the minimum-spinner pattern:

```tsx
const minimumMs = 500;
const submitStart = useRef(0);
const [submitting, setSubmitting] = useState(false);

// In onStart: submitStart.current = Date.now(); setSubmitting(true);
// In onFinish: setTimeout(() => setSubmitting(false), Math.max(0, minimumMs - elapsed));

<Button type="submit" disabled={submitting || form.processing || !form.isDirty}>
    {(submitting || form.processing) && <Spinner />}
    Save
</Button>
```

### Empty States

For areas that can be empty, use a dashed border container:

```tsx
<div className="rounded-xl border border-dashed border-sidebar-border/70 px-4 py-6 text-center text-xs text-muted-foreground dark:border-sidebar-border">
    No items yet.
</div>
```

However, avoid showing empty states when data is always present (e.g., a server always has at least one allocation).

## Color Palette

| Token | Usage |
|---|---|
| `text-foreground` | Primary text, values, headings |
| `text-muted-foreground` | Labels, descriptions, secondary info |
| `bg-background` | Inner card surfaces |
| `bg-sidebar` | Outer card wrapper (creates depth) |
| `bg-muted/20` | Item card backgrounds |
| `border-sidebar-accent` | Card borders |
| `border-border/70` | Lighter item borders |
| `text-primary`, `bg-primary/10` | Accent badges, active states |
| `text-destructive`, `hover:text-destructive` | Delete/remove actions |
| `#d92400` | Chart strokes, brand accent |

## Available UI Components

Located in `resources/js/components/ui/`:

- **Layout**: `sidebar`, `sliding-tabs`, `separator`
- **Feedback**: `alert`, `alert-dialog`, `dialog`, `sonner` (toasts), `spinner`, `tooltip`
- **Forms**: `button`, `input`, `label`, `select`, `switch`, `checkbox`, `toggle`, `toggle-group`
- **Data**: `badge`, `avatar`, `skeleton`, `card`
- **Navigation**: `breadcrumb`, `dropdown-menu`, `navigation-menu`, `collapsible`, `sheet`
- **Decoration**: `placeholder-pattern` (hatched SVG)

Custom shared components in `resources/js/components/`:

- `Heading` — Page and section headings with `variant="default"` or `variant="small"`
- `InputError` — Inline validation error display
- `ServerStatusIndicator` — Colored dot for server states

## Responsive Design

- Use `sm:`, `md:`, `lg:`, `xl:` breakpoints for grid columns.
- Item card grids: `grid gap-2 sm:grid-cols-2` (2 cols on small+).
- Stat/chart grids: `grid gap-4 md:grid-cols-3` (3 cols on medium+).
- Console meta items: `grid gap-3 sm:grid-cols-2 xl:grid-cols-3`.
- Forms constrain width with `max-w-md` or `max-w-xl`, never full width.
- Buttons wrap naturally with `flex flex-wrap items-center gap-2`.

## Anti-Patterns (Do Not)

- **Don't use full-width list rows** for items — use the item card pattern in a grid instead.
- **Don't use text buttons for row actions** — use icon buttons with tooltips.
- **Don't use `<Badge variant="outline">`** for status pills — use the inline pill pattern with `bg-primary/10`.
- **Don't show empty states when data is guaranteed** (e.g., every server has a primary allocation).
- **Don't use `session('error')` flash** for user-facing errors — return `withErrors()` so the frontend `onError` callback catches them.
- **Don't skip the `PlaceholderPattern`** in icon boxes — it's a core visual signature.
- **Don't use raw `<div>` cards** without the `bg-sidebar p-1` wrapper — it breaks the layered depth feel.
- **Don't put save buttons inside the card** — place them below the card in a `flex items-center gap-4` row.
