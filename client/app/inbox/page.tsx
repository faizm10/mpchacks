'use client'

import { AnimatePresence, motion } from 'motion/react'
import InboxFeed from '../../components/inbox/InboxFeed'
import DetailPanel from '../../components/inbox/DetailPanel'
import { useInbox } from '../../hooks/useInbox'

export default function InboxPage() {
  const { items, selectedItem, selectItem, resolveItem, filter, setFilter, isLoading } = useInbox()

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
        <InboxFeed
          items={items}
          selectedItemId={selectedItem?.id}
          onItemSelect={selectItem}
          filter={filter}
          onFilterChange={setFilter}
          isLoading={isLoading}
        />
      </div>

      <AnimatePresence>
        {selectedItem && (
          <motion.div
            key="detail"
            initial={{ x: 360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 360, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{
              width: 360,
              flexShrink: 0,
              borderLeft: '0.5px solid var(--border-subtle)',
              overflow: 'hidden',
            }}
          >
            <DetailPanel
              item={selectedItem}
              onClose={() => selectItem(null)}
              onResolve={resolveItem}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
