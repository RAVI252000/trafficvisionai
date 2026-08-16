import type { ReactNode } from 'react'

export interface Column<T> {
  key: string
  header: string
  render?: (item: T) => ReactNode
}

export interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (item: T) => string | number
  emptyMessage?: string
}

export function Table<T>({ columns, data, keyExtractor, emptyMessage = 'No data available.' }: TableProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-tv-border bg-tv-surface">
      <table className="w-full text-left text-sm text-tv-text">
        <thead className="border-b border-tv-border bg-black/[0.01] text-xs uppercase text-tv-muted">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-6 py-4 font-semibold tracking-wider">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-tv-border">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-8 text-center text-tv-muted">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={keyExtractor(item)} className="transition-colors hover:bg-black/[0.01]">
                {columns.map((col) => (
                  <td key={col.key} className="whitespace-nowrap px-6 py-4">
                    {col.render ? col.render(item) : String((item as any)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
