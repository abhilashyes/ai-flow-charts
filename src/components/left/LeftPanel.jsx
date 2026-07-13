import { useState } from 'react'
import TabNavigation from './TabNavigation'
import ProcessesTab from './ProcessesTab'
import ConnectorsTab from './ConnectorsTab'
import SettingsTab from './SettingsTab'
import { TABS, MODES } from '../../utils/constants'

export default function LeftPanel({ vc }) {
  const [tab, setTab] = useState(TABS.PROCESSES)

  // In comparison mode, editing targets the standard chain by convention.
  const editMode = vc.currentMode === MODES.IDEAL ? MODES.IDEAL : MODES.STANDARD
  const editModeLabel = editMode === MODES.IDEAL ? 'Ideal' : 'Standard'

  return (
    <div className="flex h-full flex-col bg-white">
      <TabNavigation active={tab} onChange={setTab} />
      {vc.currentMode === MODES.COMPARISON && tab !== TABS.SETTINGS && (
        <div className="border-b border-amber-100 bg-amber-50 px-3 py-1.5 text-[11px] text-amber-700">
          Comparison mode — edits apply to the <b>Standard</b> chain. Switch to Ideal in Settings to edit that side.
        </div>
      )}
      <div className="min-h-0 flex-1">
        {tab === TABS.PROCESSES && <ProcessesTab vc={vc} editMode={editMode} editModeLabel={editModeLabel} />}
        {tab === TABS.CONNECTORS && <ConnectorsTab vc={vc} editMode={editMode} editModeLabel={editModeLabel} />}
        {tab === TABS.SETTINGS && <SettingsTab vc={vc} />}
      </div>
    </div>
  )
}
