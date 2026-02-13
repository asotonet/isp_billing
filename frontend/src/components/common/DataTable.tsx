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
      {/* Decorative tech corners */}
      <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-primary/30 rounded-tl-lg" />
      <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-primary/30 rounded-tr-lg" />

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
                <div className="flex items-center gap-2">
                  {col.header}
                  {i === 0 && (
                    <Sparkles className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
                  )}
                </div>
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
                "border-b border-border transition-all duration-300 group relative",
                rowIdx % 2 === 0 ? "bg-card" : "bg-muted/20",
                onRowClick && "cursor-pointer hover:bg-primary/5 hover:shadow-lg",
                "animate-fade-in"
              )}
              style={{ animationDelay: `${rowIdx * 30}ms` }}
              onClick={() => onRowClick?.(row)}
            >
              {/* Hover glow effect */}
              {onRowClick && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-chart-3/10 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-lg" />
              )}

              {/* Side indicator */}
              {onRowClick && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-chart-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-r-full" />
              )}

              {columns.map((col, colIdx) => (
                <TableCell
                  key={colIdx}
                  className={cn(
                    "relative z-10 transition-colors duration-300",
                    col.className
                  )}
                >
                  {typeof col.accessor === "function"
                    ? col.accessor(row)
                    : (row[col.accessor] as React.ReactNode)}
                </TableCell>
              ))}

              {/* Shimmer effect on hover */}
              {onRowClick && (
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none overflow-hidden">
                  <div className="shimmer" />
                </div>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Decorative tech corners bottom */}
      <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-primary/30 rounded-bl-lg" />
      <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-primary/30 rounded-br-lg" />
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
