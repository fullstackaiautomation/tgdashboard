# shadcn/ui Table Components - Comprehensive Reference

## Overview

shadcn/ui provides two approaches for building tables:
1. **Basic Table Component** - For simple, static tables with manual implementation
2. **Data Table with TanStack** - For advanced tables with sorting, filtering, pagination, and row selection

## Installation Status

**Current Project Status:**
- **Table Component**: NOT INSTALLED (needs to be added)
- **TanStack React Table**: NOT INSTALLED (needs to be added)
- **@tanstack/react-query**: INSTALLED ✓ (v5.90.2)

### Installation Commands

```bash
# Install the basic table component
pnpm dlx shadcn@latest add table

# Install TanStack Table for advanced features
pnpm add @tanstack/react-table
```

---

## Part 1: Basic Table Component

### Sub-Components

The table component consists of 8 composable elements that map to semantic HTML table elements:

| Component | HTML Element | Purpose |
|-----------|--------------|---------|
| `Table` | `<table>` | Root container for the entire table |
| `TableCaption` | `<caption>` | Descriptive caption (above/below table) |
| `TableHeader` | `<thead>` | Header section containing column headings |
| `TableHead` | `<th>` | Individual header cell |
| `TableBody` | `<tbody>` | Container for data rows |
| `TableRow` | `<tr>` | Single row of cells |
| `TableCell` | `<td>` | Individual data cell |
| `TableFooter` | `<tfoot>` | Footer section for summary information |

### Basic Usage Pattern

```tsx
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function InvoiceTable() {
  return (
    <Table>
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Invoice</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Method</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => (
          <TableRow key={invoice.invoice}>
            <TableCell className="font-medium">{invoice.invoice}</TableCell>
            <TableCell>{invoice.paymentStatus}</TableCell>
            <TableCell>{invoice.paymentMethod}</TableCell>
            <TableCell className="text-right">{invoice.totalAmount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className="text-right">$2,500.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}
```

### Styling Options

All sub-components accept standard props:
- **className**: For Tailwind utility classes
- **Standard HTML attributes**: All native table element attributes

Common styling patterns:

```tsx
// Fixed column width
<TableHead className="w-[100px]">Invoice</TableHead>

// Text alignment
<TableCell className="text-right">Amount</TableCell>

// Typography emphasis
<TableCell className="font-medium">ID</TableCell>

// Column spanning (in footer)
<TableCell colSpan={3}>Total</TableCell>

// Responsive design
<div className="overflow-x-auto">
  <Table>
    {/* ... */}
  </Table>
</div>
```

### Accessibility Features

- Semantic HTML structure (thead, tbody, tfoot, th, td)
- Caption support for screen readers
- Proper heading hierarchy with `<th>` elements
- Print-friendly formatting
- Export-ready semantic structure

---

## Part 2: Advanced Data Tables with TanStack

### When to Use TanStack Tables

Use TanStack React Table when you need:
- **Sorting**: Click column headers to sort ascending/descending
- **Filtering**: Search/filter by column values
- **Pagination**: Navigate large datasets page by page
- **Row Selection**: Select individual or all rows with checkboxes
- **Column Visibility**: Toggle which columns are shown
- **Complex State Management**: Multiple interactive features combined

### File Structure Pattern

Recommended organization for data tables:

```
src/
├── components/
│   ├── ui/
│   │   ├── table.tsx           # Basic table components
│   │   └── data-table.tsx      # Reusable DataTable component (optional)
│   └── [feature]/
│       ├── columns.tsx         # Column definitions
│       ├── data-table.tsx      # Feature-specific table (or use shared)
│       └── page.tsx            # Page that renders the table
```

### Step 1: Define Your Data Type and Columns

**File: `columns.tsx`**

```tsx
import { ColumnDef } from "@tanstack/react-table"

// Define your data structure
export type Payment = {
  id: string
  amount: number
  status: "pending" | "processing" | "success" | "failed"
  email: string
}

// Define columns
export const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)
      return <div className="text-right font-medium">{formatted}</div>
    },
  },
]
```

### Step 2: Create the DataTable Component

**File: `data-table.tsx`**

```tsx
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
```

### Step 3: Use the DataTable in Your Page

**File: `page.tsx`**

```tsx
import { Payment, columns } from "./columns"
import { DataTable } from "./data-table"

async function getData(): Promise<Payment[]> {
  // Fetch data from your API or database
  return [
    {
      id: "728ed52f",
      amount: 100,
      status: "pending",
      email: "m@example.com",
    },
    // ...more data
  ]
}

export default async function PaymentsPage() {
  const data = await getData()

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  )
}
```

### Advanced Features

#### 1. Sorting

**Update `data-table.tsx`:**

```tsx
import {
  SortingState,
  getSortedRowModel,
  // ... other imports
} from "@tanstack/react-table"

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  })

  // ... rest of component
}
```

**Update column definition:**

```tsx
{
  accessorKey: "email",
  header: ({ column }) => {
    return (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Email
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    )
  },
}
```

#### 2. Filtering

**Add to `data-table.tsx`:**

```tsx
import {
  ColumnFiltersState,
  getFilteredRowModel,
  // ... other imports
} from "@tanstack/react-table"

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

  const table = useReactTable({
    // ... other config
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnFilters,
    },
  })

  return (
    <div>
      {/* Filter Input */}
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter emails..."
          value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("email")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>
      {/* Table */}
      <div className="rounded-md border">
        <Table>{/* ... */}</Table>
      </div>
    </div>
  )
}
```

#### 3. Pagination

**Add to `data-table.tsx`:**

```tsx
import {
  getPaginationRowModel,
  // ... other imports
} from "@tanstack/react-table"

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    // ... other config
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div>
      <div className="rounded-md border">
        <Table>{/* ... */}</Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
```

Default page size is **10 rows**. To customize:

```tsx
const table = useReactTable({
  // ...
  initialState: {
    pagination: {
      pageSize: 20,
    },
  },
})
```

#### 4. Column Visibility

**Add to `data-table.tsx`:**

```tsx
import {
  VisibilityState,
  // ... other imports
} from "@tanstack/react-table"

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})

  const table = useReactTable({
    // ... other config
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      columnVisibility,
    },
  })

  return (
    <div>
      {/* Column Visibility Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="ml-auto">
            Columns
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {table
            .getAllColumns()
            .filter((column) => column.getCanHide())
            .map((column) => {
              return (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) =>
                    column.toggleVisibility(!!value)
                  }
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              )
            })}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="rounded-md border">
        <Table>{/* ... */}</Table>
      </div>
    </div>
  )
}
```

#### 5. Row Selection

**Add to `data-table.tsx`:**

```tsx
import {
  RowSelectionState,
  // ... other imports
} from "@tanstack/react-table"

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})

  const table = useReactTable({
    // ... other config
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
  })

  return (
    <div>
      <div className="rounded-md border">
        <Table>{/* ... */}</Table>
      </div>

      {/* Show selected count */}
      <div className="flex-1 text-sm text-muted-foreground">
        {table.getFilteredSelectedRowModel().rows.length} of{" "}
        {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
    </div>
  )
}
```

**Add checkbox column:**

```tsx
import { Checkbox } from "@/components/ui/checkbox"

export const columns: ColumnDef<Payment>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  // ... other columns
]
```

---

## Part 3: Current Project Implementation

### Existing Table Usage

The project currently uses **native HTML tables** without shadcn/ui components:

**File:** `C:\Users\blkw\OneDrive\Documents\Claude Code\TG Personal\Dashboard\tg-dashboard\src\components\content\ContentTable.tsx`

**Current Implementation:**
- Native `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<td>`, `<th>` elements
- Manual styling with Tailwind classes
- Custom expandable rows
- No sorting, filtering, or pagination
- 9 columns: expand button, title, platform, business, value rating, TG rating, Google LLM, tags, actions

**Key Features:**
- Expandable rows showing full details (AI summary, notes, all tags, dashboard areas)
- Action buttons (view details, edit, delete, favorite)
- Tag color mapping
- Truncated text with hover titles
- Empty state handling

### Migration Path to shadcn/ui Tables

#### Option 1: Basic Table Component (Minimal Changes)

Replace native HTML elements with shadcn/ui components for better styling consistency:

```tsx
// Before
<table className="w-full">
  <thead>
    <tr className="border-b border-gray-700 bg-gray-900">
      <th className="px-4 py-3 text-left">Title</th>
    </tr>
  </thead>
</table>

// After
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "@/components/ui/table"

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Title</TableHead>
    </TableRow>
  </TableHeader>
</Table>
```

**Benefits:**
- Consistent design system
- Better accessibility
- Minimal code changes

#### Option 2: TanStack Data Table (Advanced Features)

Upgrade to full-featured data table:

```tsx
// Define columns in columns.tsx
export const contentColumns: ColumnDef<ContentItem>[] = [
  {
    id: "select",
    header: ({ table }) => (/* Select all checkbox */),
    cell: ({ row }) => (/* Row checkbox */),
  },
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting()}>
        Title <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "source",
    header: "Platform",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="text-lg">{getSourceIcon(row.original.source)}</span>
        <span>{row.getValue("source")}</span>
      </div>
    ),
  },
  // ... more columns
]
```

**Benefits:**
- Sortable columns
- Filter by title, platform, tags, etc.
- Pagination for large datasets
- Row selection for bulk actions
- Column visibility toggles

**Trade-offs:**
- More boilerplate code
- Need to refactor expandable row logic
- More complex state management

---

## Best Practices

### 1. Component Organization

**For Simple Tables:**
- Keep table inline in the component
- Use basic Table components

**For Complex Tables:**
- Extract column definitions to `columns.tsx`
- Create reusable `DataTable` component
- Separate data fetching from display logic

### 2. Performance Optimization

```tsx
// Memoize column definitions
const columns = React.useMemo<ColumnDef<Payment>[]>(
  () => [
    // ... columns
  ],
  []
)

// Memoize data
const data = React.useMemo(() => fetchedData, [fetchedData])
```

### 3. Accessibility

- Always use semantic table elements (or shadcn components that render them)
- Add ARIA labels to interactive elements
- Ensure keyboard navigation works
- Use `TableCaption` for screen readers

### 4. Responsive Design

```tsx
// Wrapper for horizontal scroll on mobile
<div className="overflow-x-auto">
  <Table>
    {/* ... */}
  </Table>
</div>

// Or use ScrollArea component
import { ScrollArea } from "@/components/ui/scroll-area"

<ScrollArea className="h-[600px]">
  <Table>
    {/* ... */}
  </Table>
</ScrollArea>
```

### 5. Custom Cell Rendering

```tsx
{
  accessorKey: "amount",
  header: "Amount",
  cell: ({ row }) => {
    const amount = parseFloat(row.getValue("amount"))
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
    return <div className="text-right font-medium">{formatted}</div>
  },
}
```

### 6. State Management

For tables that need to persist state (sorting, filters, pagination):

```tsx
// Store in URL params
const [sorting, setSorting] = useSearchParams()

// Store in localStorage
useEffect(() => {
  localStorage.setItem('tableState', JSON.stringify(columnVisibility))
}, [columnVisibility])

// Store in global state (Jotai, Redux, etc.)
const [sorting, setSorting] = useAtom(tableSortingAtom)
```

---

## Common Patterns

### Pattern 1: Actions Column

```tsx
{
  id: "actions",
  cell: ({ row }) => {
    const payment = row.original

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleEdit(payment)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDelete(payment.id)}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  },
}
```

### Pattern 2: Status Badges

```tsx
{
  accessorKey: "status",
  header: "Status",
  cell: ({ row }) => {
    const status = row.getValue("status") as string
    return (
      <Badge variant={status === "success" ? "default" : "destructive"}>
        {status}
      </Badge>
    )
  },
}
```

### Pattern 3: Custom Sorting

```tsx
{
  accessorKey: "priority",
  header: "Priority",
  sortingFn: (rowA, rowB) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return priorityOrder[rowA.original.priority] - priorityOrder[rowB.original.priority]
  },
}
```

### Pattern 4: Expandable Rows

```tsx
// Add expansion state
const [expanded, setExpanded] = React.useState<ExpandedState>({})

const table = useReactTable({
  // ...
  onExpandedChange: setExpanded,
  getExpandedRowModel: getExpandedRowModel(),
  state: {
    expanded,
  },
})

// In column definition
{
  id: "expander",
  header: () => null,
  cell: ({ row }) => {
    return row.getCanExpand() ? (
      <button onClick={row.getToggleExpandedHandler()}>
        {row.getIsExpanded() ? <ChevronDown /> : <ChevronRight />}
      </button>
    ) : null
  },
}

// Render expanded content
{row.getIsExpanded() && (
  <TableRow>
    <TableCell colSpan={columns.length}>
      {/* Expanded content */}
    </TableCell>
  </TableRow>
)}
```

---

## Resources

- **Official Docs**: https://ui.shadcn.com/docs/components/table
- **Data Table Guide**: https://ui.shadcn.com/docs/components/data-table
- **TanStack Table**: https://tanstack.com/table/v8
- **Example Implementation**: See ContentTable.tsx for custom table patterns

---

## Quick Decision Matrix

| Use Case | Recommendation | Complexity |
|----------|---------------|-----------|
| Static display table (invoices, receipts) | Basic Table | Low |
| Content list with actions | Basic Table + custom logic | Medium |
| Large dataset (100+ rows) | Data Table + Pagination | Medium |
| Need sorting/filtering | Data Table + TanStack | Medium-High |
| Complex interactions (multi-select, bulk actions) | Data Table + Full TanStack | High |
| Real-time updates | Basic Table + Supabase realtime | Medium |

---

## Next Steps

1. Install shadcn/ui table component: `pnpm dlx shadcn@latest add table`
2. Install TanStack Table (if needed): `pnpm add @tanstack/react-table`
3. Choose between basic or advanced approach based on requirements
4. Consider migrating ContentTable.tsx as a pilot implementation
5. Create reusable DataTable component if building multiple tables