import { Boxes, Workflow, Settings } from 'lucide-react'
import { TABS } from '../../utils/constants'

const ITEMS = [
  { id: TABS.PROCESSES, label: 'Processes', Icon: Boxes },
  { id: TABS.CONNECTORS, label: 'Connectors', Icon: Workflow },
  { id: TABS.SETTINGS, label: 'Settings', Icon: Settings },
]

export default function TabNavigation({ active, onChange }) {
  return (
    <div className="flex border-b border-slate-200 bg-slate-50">
      {ITEMS.map(({ id, label, Icon }) => {
        const isActive = active === id
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 px-2 py-2.5 text-[12px] font-semibold transition ${
              isActive
                ? 'border-blue-600 bg-white text-blue-600'
                : 'border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        )
      })}
    </div>
  )
}
