'use client'

import ReportCard from '../../components/reports/ReportCard'
import ReportDetail from '../../components/reports/ReportDetail'
import { useReports } from '../../hooks/useReports'

export default function ReportsPage() {
  const { trips, selectedTrip, selectTrip, isLoading } = useReports()

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 16px 20px', minWidth: 0 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
            {trips.length} AI-grouped trips · 6-month period
          </div>
        </div>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
            Loading…
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {trips.map(trip => (
              <ReportCard
                key={trip.id}
                trip={trip}
                isSelected={trip.id === selectedTrip?.id}
                onClick={() => selectTrip(trip)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail */}
      <div style={{
        width: 380,
        flexShrink: 0,
        borderLeft: '0.5px solid var(--border-subtle)',
        overflowY: 'auto',
        background: 'var(--surface-1)',
      }}>
        {selectedTrip ? (
          <ReportDetail trip={selectedTrip} />
        ) : (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Select a report to view details</div>
          </div>
        )}
      </div>
    </div>
  )
}
