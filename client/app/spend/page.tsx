'use client'

import KPIGrid from '../../components/spend/KPIGrid'
import SpendChart from '../../components/spend/SpendChart'
import MerchantTable from '../../components/spend/MerchantTable'
import { useSpend } from '../../hooks/useSpend'

export default function SpendPage() {
  const { summary, activeTab, setActiveTab, isLoading } = useSpend()

  if (isLoading || !summary) {
    return <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>Loading…</div>
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '16px 20px' }}>
      <KPIGrid summary={summary} />
      <div style={{ display: 'flex', gap: 16, marginTop: 16, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <SpendChart summary={summary} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
        <div style={{ width: 340, flexShrink: 0 }}>
          <MerchantTable merchants={summary.topMerchants} />
        </div>
      </div>
    </div>
  )
}
