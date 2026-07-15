import { useState } from 'react'
import TabNavigation from './TabNavigation'
import ProcessesTab from './ProcessesTab'
import ConnectorsTab from './ConnectorsTab'
import JsonTab from './JsonTab'
import { TABS } from '../../utils/constants'

export default function LeftPanel({ vc }) {
  const [tab, setTab] = useState(TABS.PROCESSES)

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
