/**
 * Dashboard — CivicPulse Impact Dashboard.
 * Shows: aggregate stats, category pie, priority distribution, AI insight card, leaderboard.
 */

import { useEffect, useState, useMemo } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { getLeaderboard } from '../services/api'
import useStore from '../store/useStore'
import { CATEGORIES, BADGE_META, priorityColor, cn } from '../lib/utils'

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ value, label, color = '#1A73E8', icon }) {
  return (
    <div className="bg-white rounded-card shadow-card p-5 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="font-mono text-3xl font-bold" style={{ color }}>{value}</div>
      <div className="text-xs text-civic-muted mt-1">{label}</div>
    </div>
  )
}

// ─── AI insight card ──────────────────────────────────────────────────────────
function AIInsightCard({ briefing }) {
  if (!briefing) return null
  return (
    <div className="bg-civic-dark text-white rounded-card p-5 border-l-4 border-civic-blue">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-civic-blue font-semibold text-sm">🧠 Today's AI Briefing</span>
        <a href="/mayor" className="ml-auto text-xs text-white/40 hover:text-white/70 transition-colors">
          Full briefing →
        </a>
      </div>
      <p className="text-sm text-white/80 leading-relaxed font-mono line-clamp-3">
        {briefing.summary}
      </p>
      <div className="flex gap-4 mt-4 text-xs text-white/50">
        <span>🔴 {briefing.total_critical} critical</span>
        <span>🔗 {briefing.duplicates_merged_today} merged</span>
        {briefing.hotspots?.[0] && (
          <span>🔥 {briefing.hotspots[0].area}</span>
        )}
      </div>
    </div>
  )
}

// ─── Leaderboard ──────────────────────────────────────────────────────────────
function Leaderboard({ entries }) {
  const RANK_COLORS = ['#FBBC04', '#9AA0A6', '#CD7F32']
  return (
    <div className="bg-white rounded-card shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-civic-border">
        <h3 className="font-semibold text-civic-text">🏆 Civic Leaderboard</h3>
      </div>
      <div className="divide-y divide-civic-border">
        {entries.map((entry, i) => {
          const badge = BADGE_META[entry.badge] || BADGE_META.NEWCOMER
          return (
            <div key={entry.uid} className="flex items-center gap-3 px-5 py-3">
              <span
                className="font-mono font-bold text-sm w-6 text-center"
                style={{ color: RANK_COLORS[i] || '#9AA0A6' }}
              >
                {entry.rank}
              </span>
              <img
                src={entry.photo_url || ''}
                alt={entry.display_name}
                className="w-8 h-8 rounded-full bg-civic-surface border border-civic-border"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-civic-text truncate">{entry.display_name}</p>
                <p className="text-xs text-civic-muted">{badge.emoji} {badge.label}</p>
              </div>
              <span className="font-mono font-bold text-civic-blue text-sm">{entry.points} pts</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const issues       = useStore((s) => s.issues)
  const mayorBriefing = useStore((s) => s.mayorBriefing)

  const [leaderboard, setLeaderboard] = useState([])

  useEffect(() => {
    getLeaderboard(10).then(setLeaderboard).catch(console.error)
  }, [])

  // Derived stats
  const stats = useMemo(() => {
    const resolved = issues.filter((i) => i.status === 'RESOLVED')
    const critical = issues.filter((i) => (i.priorityScore || 0) >= 81)
    const duplicates = issues.filter((i) => i.duplicateOf)
    return {
      total:      issues.length,
      resolved:   resolved.length,
      critical:   critical.length,
      duplicates: duplicates.length,
    }
  }, [issues])

  // Category distribution for pie chart
  const categoryData = useMemo(() => (
    Object.entries(CATEGORIES).map(([key, cat]) => ({
      name:  cat.label,
      value: issues.filter((i) => i.category === key).length,
      color: cat.pinColor,
    })).filter((d) => d.value > 0)
  ), [issues])

  // Priority distribution for bar chart
  const priorityData = useMemo(() => {
    const buckets = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 }
    issues.forEach((i) => {
      const s = i.priorityScore || 0
      if (s >= 81)      buckets.CRITICAL++
      else if (s >= 61) buckets.HIGH++
      else if (s >= 31) buckets.MEDIUM++
      else              buckets.LOW++
    })
    return Object.entries(buckets).map(([name, count]) => ({
      name,
      count,
      fill: priorityColor(name === 'CRITICAL' ? 90 : name === 'HIGH' ? 70 : name === 'MEDIUM' ? 50 : 20).bar,
    }))
  }, [issues])

  return (
    <div className="page-scroll">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div>
          <h1 className="font-display text-2xl font-bold text-civic-text">CivicPulse Impact</h1>
          <p className="text-sm text-civic-muted mt-0.5">Live civic intelligence dashboard</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon="🏙️" value={stats.total}      label="Issues Reported"  color="#1A73E8" />
          <StatCard icon="✅" value={stats.resolved}   label="Resolved"          color="#34A853" />
          <StatCard icon="🔴" value={stats.critical}   label="Critical"          color="#EA4335" />
          <StatCard icon="🔗" value={stats.duplicates} label="Duplicates Merged" color="#FF8C00" />
        </div>

        {/* AI Briefing card */}
        <AIInsightCard briefing={mayorBriefing} />

        {/* Charts row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Category pie */}
          <div className="bg-white rounded-card shadow-card p-5">
            <h3 className="font-semibold text-civic-text mb-4">Issues by Category</h3>
            {categoryData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                  {categoryData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1 text-xs text-civic-muted">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                      {d.name} ({d.value})
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-44 flex items-center justify-center text-civic-muted text-sm">
                No data yet
              </div>
            )}
          </div>

          {/* Priority bar chart */}
          <div className="bg-white rounded-card shadow-card p-5">
            <h3 className="font-semibold text-civic-text mb-4">Priority Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={priorityData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8EAED" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#5F6368' }} />
                <YAxis tick={{ fontSize: 11, fill: '#5F6368' }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Leaderboard */}
        {leaderboard.length > 0 && <Leaderboard entries={leaderboard} />}

      </div>
    </div>
  )
}
