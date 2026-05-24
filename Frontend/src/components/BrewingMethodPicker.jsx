export const BREWING_METHODS = [
  { value: 'pour_over', label: 'Pour-Over (V60)' },
  { value: 'cold_brew', label: 'Cold Brew' },
  { value: 'phin', label: 'Phin' },
  { value: 'coffee_milk', label: 'Coffee Sữa' },
  { value: 'latte', label: 'Latte' },
  { value: 'cappuccino', label: 'Cappuccino' },
  { value: 'espresso', label: 'Espresso' },
]

export function getBrewingMethodLabel(value) {
  return BREWING_METHODS.find((m) => m.value === value)?.label || value || ''
}

export default function BrewingMethodPicker({ value, onChange, disabled = false }) {
  return (
    <div className="flex flex-col gap-2 md:col-span-2">
      <label className="font-label-md text-on-surface-variant">Cách pha</label>
      <div className="relative">
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={disabled}
          className="w-full appearance-none bg-surface-container border-none rounded-xl px-4 py-3 font-body-md text-body-md focus:ring-2 focus:ring-primary/20 disabled:opacity-60 pr-10"
        >
          <option value="">— Chọn cách pha —</option>
          {BREWING_METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
          expand_more
        </span>
      </div>
      {value && (
        <p className="font-label-sm text-on-surface-variant">
          Cách pha đã chọn:{' '}
          <span className="font-label-sm text-primary font-bold">
            {getBrewingMethodLabel(value)}
          </span>
        </p>
      )}
    </div>
  )
}
