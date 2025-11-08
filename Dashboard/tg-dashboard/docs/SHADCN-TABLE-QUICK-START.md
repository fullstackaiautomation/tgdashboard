# shadcn/ui Table Quick Start Guide

## Installation

```bash
# Install table component
pnpm dlx shadcn@latest add table

# Install TanStack Table (for advanced features)
pnpm add @tanstack/react-table
```

---

## Basic Table (Simple Use Cases)

### Import

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
```

### Minimal Example

```tsx
export function SimpleTable({ data }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell>{item.email}</TableCell>
            <TableCell className="text-right">{item.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

---

## Data Table (Advanced Features)

### File Structure

```
components/
  └── payments/
      ├── columns.tsx        # Column definitions
      ├── data-table.tsx     # DataTable component
      └── page.tsx           # Page using the table
```

### Step 1: Define Columns (`columns.tsx`)

```tsx
import { ColumnDef } from "@tanstack/react-table"

export type Payment = {
  id: string
  amount: number
  status: "pending" | "success" | "failed"
  email: string
}

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
      return <div className="text-right">{formatted}</div>
    },
  },
]
```

### Step 2: Create DataTable Component (`data-table.tsx`)

```tsx
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
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
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
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

### Step 3: Use in Page (`page.tsx`)

```tsx
import { columns } from "./columns"
import { DataTable } from "./data-table"

export function PaymentsPage() {
  const data = [
    { id: "1", amount: 100, status: "pending", email: "user@example.com" },
    // ... more data
  ]

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  )
}
```

---

## Feature Add-ons

### Add Sorting

**Update `data-table.tsx`:**

```tsx
import { SortingState, getSortedRowModel } from "@tanstack/react-table"
import { useState } from "react"

export function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
  })

  // ... rest of component
}
```

**Update column in `columns.tsx`:**

```tsx
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"

{
  accessorKey: "email",
  header: ({ column }) => (
    <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
      Email <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  ),
}
```

### Add Filtering

**Update `data-table.tsx`:**

```tsx
import { ColumnFiltersState, getFilteredRowModel } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"

export function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const table = useReactTable({
    // ... other config
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: { columnFilters },
  })

  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter emails..."
          value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
          onChange={(e) => table.getColumn("email")?.setFilterValue(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>{/* ... */}</Table>
      </div>
    </div>
  )
}
```

### Add Pagination

**Update `data-table.tsx`:**

```tsx
import { getPaginationRowModel } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"

export function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    // ... other config
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div>
      <div className="rounded-md border">
        <Table>{/* ... */}</Table>
      </div>
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

### Add Row Selection

**Add checkbox column in `columns.tsx`:**

```tsx
import { Checkbox } from "@/components/ui/checkbox"

export const columns: ColumnDef<Payment>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
  },
  // ... other columns
]
```

**Update `data-table.tsx`:**

```tsx
import { RowSelectionState } from "@tanstack/react-table"

export function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const table = useReactTable({
    // ... other config
    onRowSelectionChange: setRowSelection,
    state: { rowSelection },
  })

  return (
    <div>
      <div className="rounded-md border">
        <Table>{/* ... */}</Table>
      </div>
      <div className="text-sm text-muted-foreground">
        {table.getFilteredSelectedRowModel().rows.length} of{" "}
        {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
    </div>
  )
}
```

---

## Common Patterns

### Actions Column with Dropdown

```tsx
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

{
  id: "actions",
  cell: ({ row }) => {
    const item = row.original
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleEdit(item)}>Edit</DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDelete(item.id)}>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  },
}
```

### Status Badge

```tsx
import { Badge } from "@/components/ui/badge"

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

### Custom Formatted Cell

```tsx
{
  accessorKey: "amount",
  header: () => <div className="text-right">Amount</div>,
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

---

## Styling Tips

### Fixed Column Width

```tsx
<TableHead className="w-[100px]">ID</TableHead>
```

### Text Alignment

```tsx
<TableCell className="text-right">Amount</TableCell>
<TableCell className="text-center">Actions</TableCell>
```

### Responsive Wrapper

```tsx
<div className="overflow-x-auto">
  <Table>{/* ... */}</Table>
</div>
```

### Truncate Long Text

```tsx
<TableCell className="max-w-xs truncate" title={fullText}>
  {fullText}
</TableCell>
```

---

## When to Use What

| Use Case | Choice |
|----------|--------|
| Simple static list | Basic Table |
| Need sorting | Data Table + Sorting |
| Need search/filter | Data Table + Filtering |
| Large dataset (100+ rows) | Data Table + Pagination |
| Bulk actions | Data Table + Row Selection |
| Complex interactions | Full Data Table |

---

## Resources

- **Full Reference**: See `docs/SHADCN-TABLE-REFERENCE.md`
- **Official Docs**: https://ui.shadcn.com/docs/components/table
- **TanStack Table**: https://tanstack.com/table/v8
- **Project Example**: `src/components/content/ContentTable.tsx`