/**
 * useIssues — Firestore realtime subscription.
 * Populates the Zustand issues array live.
 * Call once at App level; reads from store everywhere else.
 */

import { useEffect } from 'react'
import { listIssues } from '../services/api'
import useStore from '../store/useStore'

export function useIssues(filters = {}) {
  const setIssues  = useStore((s) => s.setIssues)
  const filterCategory = useStore((s) => s.filterCategory)
  const filterStatus   = useStore((s) => s.filterStatus)

  useEffect(() => {
    let mounted = true

    const fetchIssues = async () => {
      try {
        const res = await listIssues({ status: filterStatus, category: filterCategory })
        if (mounted) {
          setIssues(res.items || [])
        }
      } catch (err) {
        console.error("Failed to fetch issues:", err)
      }
    }

    fetchIssues()
    
    // Poll every 5 seconds to simulate realtime
    const intervalId = setInterval(fetchIssues, 5000)

    return () => {
      mounted = false
      clearInterval(intervalId)
    }
  }, [filterCategory, filterStatus])
}

/** Selector: issues filtered by current store filters */
export const useFilteredIssues = () => useStore((s) => {
  const { issues, filterCategory, filterStatus } = s
  return issues.filter((i) => {
    if (filterCategory && i.category !== filterCategory) return false
    if (filterStatus   && i.status   !== filterStatus)   return false
    return true
  })
})
