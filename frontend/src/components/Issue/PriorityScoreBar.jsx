/**
 * PriorityScoreBar — Animated 4-factor breakdown for an issue's priority score.
 * Uses CSS animation via inline style for the fill.
 */

import { priorityColor } from '../../lib/utils'

const FACTORS = [
  { key: 'road_damage',       label: 'Road Damage',    max: 40 },
  { key: 'traffic_density',   label: 'Traffic Density', max: 25 },
  { key: 'community_votes',   label: 'Community',       max: 20 },
  { key: 'hospital_proximity', label: 'Hospital',       max: 15 },
]

export default function PriorityScoreBar({ score = 0, label = 'MEDIUM', breakdown }) {
  const colors = priorityColor(score)

  return (
    <div className="bg-white rounded-card border border-civic-border p-4">
      {/* Score header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="font-mono text-4xl font-bold" style={{ color: colors.bar }}>
            {score}
          </span>
          <span className="text-civic-muted text-sm ml-1">/100</span>
        </div>
        <span
          className="text-sm font-bold px-3 py-1 rounded-pill"
          style={{ background: colors.bg, color: colors.text }}
        >
          {label}
        </span>
      </div>

      {/* Overall bar */}
      <div className="h-3 rounded-full bg-gray-100 overflow-hidden mb-5">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${score}%`, background: colors.bar }}
        />
      </div>

      {/* Factor breakdown */}
      {breakdown && (
        <div className="space-y-3">
          {FACTORS.map(({ key, label: factorLabel, max }) => {
            const val = breakdown[key] ?? 0
            const pct = (val / max) * 100
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-civic-muted">{factorLabel}</span>
                  <span className="text-xs font-mono text-civic-muted">
                    {val}/{max}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${pct}%`,
                      background: colors.bar,
                      opacity: 0.7,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
