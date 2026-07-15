import { useState } from 'react'
import { Layers, Copy, GitCompareArrows, ChevronDown, Check } from 'lucide-react'
import { VERSIONS, VERSION_LABEL } from '../utils/constants'
import { Modal } from './formControls'

/**
 * Toolbar under the header: pick which version is being edited, copy a whole
 * version diagram into the active one, and toggle the top/bottom Compare view.
 */
export default function VersionBar({ vc, comparing, onToggleCompare }) {
  const [copyMenu, setCopyMenu] = useState(false)
  const [confirmCopy, setConfirmCopy] = useState(null) // source version to copy from

  const others = VERSIONS.filter((v) => v.value !== vc.activeVersion)

  return (
    <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-1.5">
      {!comparing && (
        <>
          <Layers size={15} className="text-slate-400" />
          <span className="text-[12px] font-medium text-slate-500">Version</span>
          <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
            {VERSIONS.map((v) => (
              <button
                key={v.value}
                onClick={() => vc.setActiveVersion(v.value)}
                title={v.help}
                className={`rounded-md px-2.5 py-1 text-[12px] font-semibold transition ${
                  vc.activeVersion === v.value
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Copy from another version into the active one */}
          <div className="relative">
            <button
              onClick={() => setCopyMenu((o) => !o)}
              className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <Copy size={13} /> Copy from <ChevronDown size={13} />
            </button>
            {copyMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setCopyMenu(false)} />
                <div className="absolute left-0 z-20 mt-1 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-[13px] shadow-lg">
                  {others.map((v) => (
                    <button
                      key={v.value}
                      onClick={() => {
                        setCopyMenu(false)
                        setConfirmCopy(v.value)
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-slate-700 transition hover:bg-slate-50"
                    >
                      <Copy size={13} className="text-slate-400" /> {v.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {comparing && (
        <span className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-600">
          <GitCompareArrows size={15} className="text-blue-500" /> Comparing versions
        </span>
      )}

      <button
        onClick={onToggleCompare}
        className={`ml-auto flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold transition ${
          comparing
            ? 'bg-slate-700 text-white hover:bg-slate-800'
            : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600'
        }`}
      >
        {comparing ? <Check size={14} /> : <GitCompareArrows size={14} />}
        {comparing ? 'Done comparing' : 'Compare'}
      </button>

      {confirmCopy && (
        <Modal
          title="Copy version"
          subtitle={`${VERSION_LABEL[confirmCopy]} → ${VERSION_LABEL[vc.activeVersion]}`}
          onClose={() => setConfirmCopy(null)}
        >
          <p className="text-[13px] text-slate-600">
            Replace the <b>{VERSION_LABEL[vc.activeVersion]}</b> diagram with a copy of{' '}
            <b>{VERSION_LABEL[confirmCopy]}</b>? This overwrites everything currently in{' '}
            {VERSION_LABEL[vc.activeVersion]}.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setConfirmCopy(null)}
              className="rounded-md px-3 py-1.5 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                vc.copyVersion(confirmCopy, vc.activeVersion)
                setConfirmCopy(null)
              }}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-[13px] font-semibold text-white transition hover:bg-blue-700"
            >
              Copy &amp; overwrite
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
