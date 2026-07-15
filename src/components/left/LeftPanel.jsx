import { useEffect, useState } from 'react'
import TabNavigation from './TabNavigation'
import ProcessesTab from './ProcessesTab'
import ConnectorsTab from './ConnectorsTab'
import JsonTab from './JsonTab'
import { TABS } from '../../utils/constants'

export default function LeftPanel({ vc }) {
  const [tab, setTab] = useState(TABS.PROCESSES)

  // When something is selected on the diagram, jump to its table so the matching
  // tile is visible and highlighted.
  const selectedKind = vc.selected?.kind
  useEffect(() => {
    if (selectedKind === 'process') setTab(TABS.PROCESSES)
    else if (selectedKind === 'connector') setTab(TABS.CONNECTORS)
  }, [selectedKind, vc.selected])

  return (
    <div className="flex h-full flex-col bg-white">
      <TabNavigation active={tab} onChange={setTab} />
      <div className="min-h-0 flex-1">
        {tab === TABS.PROCESSES && <ProcessesTab vc={vc} />}
        {tab === TABS.CONNECTORS && <ConnectorsTab vc={vc} />}
        {tab === TABS.JSON && <JsonTab vc={vc} />}
      </div>
    </div>
  )
}
