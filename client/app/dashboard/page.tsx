'use client'

import KPICards from '../../components/dashboard/KPICards'
import BillsPanel from '../../components/dashboard/BillsPanel'
import FlowChart from '../../components/dashboard/FlowChart'
import SpendGauge from '../../components/dashboard/SpendGauge'
import TransactionList from '../../components/dashboard/TransactionList'
import StatsRow from '../../components/dashboard/StatsRow'

export default function DashboardPage() {
  return (
    <div style={{
      padding: '16px 20px 32px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    }}>
      {/* Row 1: KPI cards */}
      <KPICards />

      {/* Row 2: Upcoming expenses + Spend flow chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 14, minHeight: 280 }}>
        <BillsPanel />
        <FlowChart />
      </div>

      {/* Row 3: Spend breakdown + Recent transactions */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 14, minHeight: 200 }}>
        <SpendGauge />
        <TransactionList />
      </div>

      {/* Row 4: Card balance + Key stats + CAD/USD converter */}
      <StatsRow />
    </div>
  )
}
