/**
 * AITimeline — 6-stage AI-enriched lifecycle for an issue.
 * Shows completed stages in green, pending in gray, current in blue.
 */

import { formatDate } from '../../lib/utils'

const STAGE_ICONS = {
  'AI Detected':          '🤖',
  'Evidence Validated':   '✅',
  'Community Confirmed':  '👥',
  'Department Assigned':  '🏛️',
  'Work Ordered':         '🔧',
  'Resolved':             '🎉',
}

export default function AITimeline({ stages = [] }) {
  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-2.5 top-2 bottom-2 w-px bg-civic-border" />

      <div className="space-y-5">
        {stages.map((stage, i) => {
          const isDone    = !!stage.timestamp
          const isCurrent = !isDone && stages[i - 1]?.timestamp

          return (
            <div key={i} className="relative flex gap-3">
              {/* Dot */}
              <div
                className={`
                  absolute -left-6 w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs shrink-0
                  ${isDone    ? 'border-civic-green  bg-civic-green  text-white'  : ''}
                  ${isCurrent ? 'border-civic-blue   bg-white        text-civic-blue' : ''}
                  ${!isDone && !isCurrent ? 'border-civic-border bg-white text-civic-muted' : ''}
                `}
              >
                {isDone ? '✓' : i + 1}
              </div>

              <div className="flex-1 pb-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">{STAGE_ICONS[stage.stage] || '📌'}</span>
                  <span
                    className={`text-sm font-semibold ${
                      isDone ? 'text-civic-text' : 'text-civic-muted'
                    }`}
                  >
                    {stage.stage}
                  </span>
                  {isCurrent && (
                    <span className="text-xs bg-blue-50 text-civic-blue px-2 py-0.5 rounded-pill font-medium">
                      Current
                    </span>
                  )}
                </div>

                {stage.timestamp && (
                  <p className="text-xs text-civic-muted mt-0.5 font-mono">
                    {formatDate(stage.timestamp)}
                  </p>
                )}

                {stage.note && (
                  <p className="text-xs text-civic-muted mt-0.5 italic">
                    {stage.note}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
