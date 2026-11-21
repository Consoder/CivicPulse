import { CATEGORIES, STATUS_META, PRIORITY_COLORS, DEPT_META, timeAgo, cn } from '../../lib/utils'
import { castVote } from '../../services/api'
import useStore from '../../store/useStore'

export default function IssueCard({ issue, onClick }) {
  const showToast = useStore((s) => s.showToast)
  const fbUser    = useStore((s) => s.firebaseUser)

  const cat      = CATEGORIES[issue.category]  || CATEGORIES.OTHER
  const status   = STATUS_META[issue.status]   || STATUS_META.REPORTED
  const priority = PRIORITY_COLORS[issue.priorityLabel || 'MEDIUM']
  const dept     = DEPT_META[issue.department] || DEPT_META.OTHER

  const handleVote = async (e, type) => {
    e.stopPropagation()
    if (!fbUser) { showToast('Sign in to vote', 'info'); return }
    try {
      await castVote(issue.id, type)
    } catch {
      showToast('Vote failed. Try again.', 'error')
    }
  }

  return (
    <div
      onClick={() => onClick?.(issue.id)}
      className="bg-white rounded-card shadow-card hover:shadow-modal transition-shadow cursor-pointer overflow-hidden animate-fade-in"
    >
      {/* Thumbnail */}
      {issue.imageUrls?.[0] && (
        <div className="h-36 overflow-hidden">
          <img src={issue.imageUrls[0]} alt={issue.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="p-4">
        {/* Top row: category emoji + title + status */}
        <div className="flex items-start gap-2 mb-2">
          <span className="text-xl shrink-0 mt-0.5">{cat.emoji}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-civic-text text-sm leading-snug line-clamp-2">
              {issue.title}
            </h3>
            <p className="text-xs text-civic-muted mt-0.5">
              📍 {issue.location?.address || 'Jaipur'} · {dept.short} · {timeAgo(issue.createdAt)}
            </p>
          </div>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-pill shrink-0"
            style={{ background: status.bg, color: status.text }}
          >
            {status.label}
          </span>
        </div>

        {/* Priority bar */}
        {issue.priorityScore != null && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-civic-muted">Priority</span>
              <span
                className="text-xs font-bold font-mono"
                style={{ color: priority?.text }}
              >
                {issue.priorityScore}/100
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${issue.priorityScore}%`,
                  background: priority?.bar || '#1A73E8',
                }}
              />
            </div>
          </div>
        )}

        {/* Escalated badge */}
        {issue.escalated && (
          <div className="mb-2">
            <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-pill font-medium">
              ⚠️ Escalated
            </span>
          </div>
        )}

        {/* Actions row */}
        <div className="flex gap-2 mt-1">
          <button
            onClick={(e) => handleVote(e, 'VERIFY')}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs border border-civic-border rounded-btn py-1.5 hover:bg-civic-surface transition-colors font-medium"
          >
            ✅ Verify <span className="text-civic-muted">({issue.verificationCount || 0})</span>
          </button>
          <button
            onClick={(e) => handleVote(e, 'UPVOTE')}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs border border-civic-border rounded-btn py-1.5 hover:bg-civic-surface transition-colors font-medium"
          >
            ▲ Upvote <span className="text-civic-muted">({issue.upvotes || 0})</span>
          </button>
        </div>
      </div>
    </div>
  )
}
