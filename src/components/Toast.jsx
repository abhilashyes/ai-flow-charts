import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react'

const CONFIG = {
  success: { Icon: CheckCircle2, cls: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  info: { Icon: Info, cls: 'border-blue-200 bg-blue-50 text-blue-700' },
  error: { Icon: AlertTriangle, cls: 'border-red-200 bg-red-50 text-red-700' },
}

export default function ToastStack({ toasts, onDismiss }) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => {
        const { Icon, cls } = CONFIG[t.kind] ?? CONFIG.info
        return (
          <div
            key={t.id}
            className={`vcm-toast-in pointer-events-auto flex items-center gap-2 rounded-lg border px-3 py-2 text-[13px] font-medium shadow-lg ${cls}`}
          >
            <Icon size={16} />
            <span>{t.message}</span>
            <button onClick={() => onDismiss(t.id)} className="ml-1 opacity-60 hover:opacity-100">
              <X size={13} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
