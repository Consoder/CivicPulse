/**
 * IssueFeed — Sortable, filterable list of all civic issues.
 * Uses the Zustand realtime store (Firestore-backed) — no extra fetch needed.
 */

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import IssueCard from '../components/Issue/IssueCard'
import useStore from '../store/useStore'
import { CATEGORIES, STATUS_META, cn } from '../lib/utils'

const SORT_OPTIONS = [
  { value: 'newest',   label: 'Newest' },
  { value: 'priority', label: 'Priority' },
  { value: 'votes',    label: 'Most Voted' },
]

const STATUS_FILTERS = ['All', 'REPORTED', 'VERIFIED', 'IN_PROGRESS', 'RESOLVED']

export default function IssueFeed() {
  const navigate = useNavigate()
  const issues   = useStore((s) => s.issues)

  const [sort,           setSort]          = useState('newest')
  const [statusFilter,   setStatusFilter]  = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [search,         setSearch]        = useState('')

  const filtered = useMemo(() => {
    let list = [...issues]

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (i) =>
          i.title?.toLowerCase().includes(q) ||
          i.location?.address?.toLowerCase().includes(q),
      )
    }

    // Status
    if (statusFilter !== 'All') {
      list = list.filter((i) => i.status === statusFilter)
    }

    // Category
    if (categoryFilter !== 'All') {
      list = list.filter((i) => i.category === categoryFilter)
    }

    // Sort
    list.sort((a, b) => {
      if (sort === 'priority') return (b.priorityScore || 0) - (a.priorityScore || 0)
      if (sort === 'votes')    return (b.upvotes || 0) - (a.upvotes || 0)
      // newest
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    })

    return list
  }, [issues, sort, statusFilter, categoryFilter, search])

  return (
    <div className="page-scroll">
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="mb-5">
          <h1 className="font-display text-2xl font-bold text-civic-text">Issue Feed</h1>
          <p className="text-sm text-civic-muted mt-0.5">{filtered.length} issues</p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-civic-muted text-sm">🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or location..."
            className="w-full pl-9 pr-4 py-2.5 border border-civic-border rounded-btn text-sm focus:outline-none focus:ring-2 focus:ring-civic-blue bg-white"
          />
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-2 mb-4">
          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border border-civic-border rounded-btn px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-civic-blue"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Status pills */}
          <div className="flex gap-1 flex-wrap">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-pill border font-medium transition-colors',
                  statusFilter === s
                    ? 'bg-civic-blue text-white border-civic-blue'
                    : 'bg-white text-civic-muted border-civic-border hover:border-civic-blue',
                )}
              >
                {s === 'All' ? 'All Status' : STATUS_META[s]?.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
          <button
            onClick={() => setCategoryFilter('All')}
            className={cn(
              'shrink-0 text-xs px-3 py-1.5 rounded-pill border font-medium transition-colors',
              categoryFilter === 'All'
                ? 'bg-civic-blue text-white border-civic-blue'
                : 'bg-white text-civic-muted border-civic-border hover:border-civic-blue',
            )}
          >
            🔵 All Categories
          </button>
          {Object.entries(CATEGORIES).map(([key, cat]) => (
            <button
              key={key}
              onClick={() => setCategoryFilter(key)}
              className={cn(
                'shrink-0 text-xs px-3 py-1.5 rounded-pill border font-medium transition-colors',
                categoryFilter === key
                  ? 'bg-civic-blue text-white border-civic-blue'
                  : 'bg-white text-civic-muted border-civic-border hover:border-civic-blue',
              )}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Issue list */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-civic-muted">
            <p className="text-4xl mb-3">🏙️</p>
            <p className="font-medium">No issues match your filters.</p>
            <p className="text-sm mt-1">Try adjusting the search or category.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                onClick={(id) => navigate(`/issues/${id}`)}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
