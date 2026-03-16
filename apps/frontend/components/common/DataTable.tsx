'use client';

import { memo, ReactNode, KeyboardEvent } from 'react';
import { TableRowSkeleton } from '@/components/ui/Loader';

export interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  skeletonRows?: number;
  onRowClick?: (item: T) => void;
  rowClassName?: string | ((item: T) => string);
  ariaLabel?: string;
}

function DataTable<T>({
  data,
  columns,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'No data found.',
  skeletonRows = 3,
  onRowClick,
  rowClassName,
  ariaLabel,
}: DataTableProps<T>) {
  const getRowClassName = (item: T) => {
    const base = 'hover:bg-stone-50 transition-colors';
    const clickable = onRowClick ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-navy-500 focus:ring-inset' : '';
    const custom = typeof rowClassName === 'function' ? rowClassName(item) : rowClassName || '';
    return `${base} ${clickable} ${custom}`.trim();
  };

  const handleRowKeyDown = (e: KeyboardEvent<HTMLTableRowElement>, item: T) => {
    if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onRowClick(item);
    }
  };

  return (
    <section className="overflow-x-auto" aria-label={ariaLabel}>
      <table className="min-w-full divide-y divide-stone-200">
        <thead className="bg-gradient-to-r from-navy-50 to-stone-100">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`px-6 py-4 text-left text-xs font-bold text-navy-900 uppercase tracking-wider ${col.headerClassName || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-stone-200">
          {isLoading && data.length === 0 && (
            <>
              {Array.from({ length: skeletonRows }).map((_, i) => (
                <TableRowSkeleton key={`skeleton-${i}`} />
              ))}
            </>
          )}
          {!isLoading && data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-stone-500">
                {emptyMessage}
              </td>
            </tr>
          )}
          {data.length > 0 && data.map((item) => (
            <tr
              key={keyExtractor(item)}
              className={getRowClassName(item)}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
              onKeyDown={onRowClick ? (e) => handleRowKeyDown(e, item) : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              aria-label={onRowClick ? 'Click to view details' : undefined}
            >
              {columns.map((col) => (
                <td key={col.key} className={`px-6 py-4 whitespace-nowrap ${col.className || ''}`}>
                  {col.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default memo(DataTable) as typeof DataTable;
