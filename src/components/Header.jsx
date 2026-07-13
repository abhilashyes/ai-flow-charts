import { Share2 } from 'lucide-react'

export default function Header() {
  return (
    <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
        <Share2 size={16} />
      </div>
      <div>
        <h1 className="text-[15px] font-bold leading-tight text-slate-800">Value Chain Mapper</h1>
        <p className="text-[11px] leading-tight text-slate-400">
          Model, visualize and compare Material &amp; Information Flow charts
        </p>
      </div>
    </header>
  )
}
