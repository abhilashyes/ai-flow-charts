import { X } from 'lucide-react'

/** Modal shell: dimmed backdrop + centered card. */
export function Modal({ title, subtitle, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4"
      onMouseDown={onClose}
    >
      <div
        className="vcm-pop w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">{title}</h3>
            {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        </div>
        <div className="vcm-scrollbar max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

const inputCls =
  'w-full rounded-md border px-2.5 py-1.5 text-[13px] outline-none transition focus:ring-2'
const okBorder = 'border-slate-300 focus:border-blue-400 focus:ring-blue-100'
const errBorder = 'border-red-400 focus:border-red-400 focus:ring-red-100'

function Label({ children }) {
  return <span className="mb-1 block text-[12px] font-medium text-slate-600">{children}</span>
}

function ErrorText({ msg }) {
  return msg ? <p className="mt-1 text-[11px] font-medium text-red-500">{msg}</p> : null
}

export function TextField({ label, value, onChange, error, placeholder, autoFocus }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input
        autoFocus={autoFocus}
        className={`${inputCls} ${error ? errBorder : okBorder}`}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      <ErrorText msg={error} />
    </label>
  )
}

export function NumberField({ label, value, onChange, error, suffix }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <div className="relative">
        <input
          type="number"
          min={0}
          className={`${inputCls} ${error ? errBorder : okBorder} ${suffix ? 'pr-10' : ''}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">
            {suffix}
          </span>
        )}
      </div>
      <ErrorText msg={error} />
    </label>
  )
}

export function SelectField({ label, value, onChange, error, children }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <select
        className={`${inputCls} bg-white ${error ? errBorder : okBorder}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
      <ErrorText msg={error} />
    </label>
  )
}

export function ReadOnlyField({ label, value }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[13px] font-semibold text-slate-500">
        {value}
      </div>
    </label>
  )
}

export function FormActions({ onCancel, submitLabel = 'Save' }) {
  return (
    <div className="mt-5 flex justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-[13px] font-medium text-slate-600 transition hover:bg-slate-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        className="rounded-md bg-blue-600 px-4 py-1.5 text-[13px] font-semibold text-white transition hover:bg-blue-700"
      >
        {submitLabel}
      </button>
    </div>
  )
}
