import { buildPageNumbers } from '../lib/pagination'

export default function Pagination({
  page,
  total,
  pageSize,
  onPageChange,
  className = '',
  label,
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1)
  const safePage = Math.min(Math.max(1, page), totalPages)
  const pages = buildPageNumbers(safePage, totalPages)
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1
  const to = Math.min(safePage * pageSize, total)

  if (totalPages <= 1 && total <= pageSize) return null

  return (
    <div
      className={`px-container-padding-mobile py-stack-sm border-t border-outline-variant/60 bg-surface-container flex flex-col sm:flex-row items-center justify-between gap-3 ${className}`}
    >
      <span className="font-body-md text-body-md text-on-surface-variant">
        {label ?? `Hiển thị ${from} - ${to} của ${total}`}
      </span>
      <div className="flex items-center gap-unit">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          className="w-8 h-8 flex items-center justify-center rounded-md border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low disabled:opacity-50 transition-colors"
          aria-label="Trang trước"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>
        {pages.map((p, idx) =>
          p === '...' ? (
            <span key={`ellipsis-${idx}`} className="font-body-md text-body-md text-on-surface-variant px-1">
              ...
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 flex items-center justify-center rounded-md font-label-md text-label-md transition-colors ${
                p === safePage
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low font-body-md text-body-md'
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          className="w-8 h-8 flex items-center justify-center rounded-md border border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low disabled:opacity-50 transition-colors"
          aria-label="Trang sau"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
        </div>
    </div>
  )
}
