import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchX, Sparkles } from "lucide-react";

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export default function DataTable<T extends { id?: string }>({
  columns,
  data,
  isLoading,
  emptyMessage = "No hay datos disponibles",
  onRowClick,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="animate-fade-in"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <Skeleton className="h-14 w-full rounded-lg animate-pulse-glow" />
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-scale-in">
        <div className="relative">
          <div className="absolute inset-0 blur-2xl bg-primary/20 rounded-full animate-breathing" />
          <SearchX className="h-16 w-16 text-muted-foreground mb-4 relative z-10 animate-bounce-in" />
        </div>
        <p className="text-lg font-medium text-foreground mb-1">{emptyMessage}</p>
        <p className="text-sm text-muted-foreground">
          Los datos aparecerán aquí cuando estén disponibles
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Decorative tech corners - hidden on mobile */}
      <div className="hidden md:block absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-primary/30 rounded-tl-lg" />
      <div className="hidden md:block absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-primary/30 rounded-tr-lg" />

      <div className="w-full overflow-x-auto rounded-lg border border-border">
        <div className="min-w-full inline-block align-middle">
        <Table>
        <TableHeader>
          <TableRow className="border-b border-primary/20 hover:bg-transparent">
            {columns.map((col, i) => (
              <TableHead
                key={i}
                className={cn(
                  "text-foreground font-semibold uppercase text-xs tracking-wider",
                  "relative group",
                  col.className
                )}
              >
                {col.header}
                {/* Animated underline */}
                <div className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-300 bg-gradient-to-r from-primary to-chart-3" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="stagger-fade">
          {data.map((row, rowIdx) => (
            <TableRow
              key={row.id || rowIdx}
              className={cn(
                "border-b border-border transition-all duration-300 group",
                rowIdx % 2 === 0 ? "bg-card" : "bg-muted/20",
                onRowClick && "cursor-pointer hover:bg-primary/5 hover:shadow-adaptive-md",
                "animate-fade-in"
              )}
              style={{ animationDelay: `${rowIdx * 30}ms` }}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col, colIdx) => (
                <TableCell
                  key={colIdx}
                  className={cn(
                    "transition-colors duration-300",
                    col.className
                  )}
                >
                  {typeof col.accessor === "function"
                    ? col.accessor(row)
                    : (row[col.accessor] as React.ReactNode)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
          </Table>
        </div>
      </div>

      {/* Decorative tech corners bottom - hidden on mobile */}
      <div className="hidden md:block absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-primary/30 rounded-bl-lg" />
      <div className="hidden md:block absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-primary/30 rounded-br-lg" />
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
