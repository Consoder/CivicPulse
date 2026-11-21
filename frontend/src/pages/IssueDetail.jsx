/**
 * IssueDetail — Full issue view.
 * Shows: image, AI analysis, priority breakdown, community votes, AI timeline.
 * Uses Firestore realtime subscription for live updates.
 */

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { subscribeToIssue } from '../services/firebase'
import { castVote } from '../services/api'
import useStore from '../store/useStore'
import AITimeline from '../components/Issue/AITimeline'
import PriorityScoreBar from '../components/Issue/PriorityScoreBar'
import { CATEGORIES, STATUS_META, DEPT_META, timeAgo, cn } from '../lib/utils'

export default function IssueDetail() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const showToast = useStore((s) => s.showToast)
  const fbUser    = useStore((s) => s.firebaseUser)

  const [issue,   setIssue]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeToIssue(id, (data) => {
      setIssue(data)
      setLoading(false)
    })
    return unsub
  }, [id])

  const handleVote = async (type) => {
    if (!fbUser) { showToast('Sign in to vote', 'info'); return }
    try {
      await castVote(id, type)
      showToast(type === 'VERIFY' ? '+5 pts for verifying! ✅' : 'Upvoted!', 'success')
    } catch {
      showToast('Vote failed. Try again.', 'error')
    }
  }

  if (loading) {
    return (
      <div className="page-scroll flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-civic-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!issue) {
    return (
      <div className="page-scroll flex flex-col items-center justify-center h-full text-civic-muted">
        <p className="text-4xl mb-3">🔍</p>
        <p className="font-medium">Issue not found.</p>
        <button onClick={() => navigate('/feed')} className="mt-4 text-civic-blue text-sm hover:underline">
          ← Back to feed
        </button>
      </div>
    )
  }

  const cat     = CATEGORIES[issue.category] || CATEGORIES.OTHER
  const status  = STATUS_META[issue.status]  || STATUS_META.REPORTED
  const dept    = DEPT_META[issue.department] || DEPT_META.OTHER
  const cie     = issue.aiAnalysis
  const score   = issue.priorityScore || 0
  const label   = cie?.agent3_priority?.priority_label || 'MEDIUM'
  const breakdown = cie?.agent3_priority?.breakdown

  return (
    <div className="page-scroll">
      <div className="max-w-2xl mx-auto">

        {/* Back */}
        <div className="px-4 pt-5 mb-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-civic-muted hover:text-civic-text transition-colors"
          >
            ← Back
          </button>
        </div>

        {/* Hero image */}
        {issue.imageUrls?.[0] && (
          <div className="relative h-52 overflow-hidden mx-4 rounded-card mb-4">
            <img
              src={issue.imageUrls[0]}
              alt={issue.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        )}

        <div className="px-4 space-y-5 pb-10">

          {/* Title + meta */}
          <div>
            <div className="flex items-start gap-2 flex-wrap mb-2">
              <span
                className="text-xs font-medium px-2.5 py-1 rounded-pill"
                style={{ background: status.bg, color: status.text }}
              >
                {status.label}
              </span>
              {issue.escalated && (
                <span className="text-xs font-bold bg-red-50 text-red-700 px-2.5 py-1 rounded-pill">
                  ⚠️ Escalated
                </span>
              )}
            </div>

            <h1 className="font-display text-2xl font-bold text-civic-text leading-snug">
              {cat.emoji} {issue.title}
            </h1>

            <div className="flex flex-wrap gap-3 mt-2 text-sm text-civic-muted">
              <span>📍 {issue.location?.address}</span>
              <span>🏛️ {dept.label}</span>
              <span>🕒 {timeAgo(issue.createdAt)}</span>
            </div>

            {issue.description && (
              <p className="mt-3 text-sm text-civic-muted leading-relaxed">
                {issue.description}
              </p>
            )}
          </div>

          {/* Priority Score Breakdown */}
          <section>
            <h2 className="text-xs font-semibold text-civic-muted uppercase tracking-wider mb-3">
              Dynamic Priority Score
            </h2>
            <PriorityScoreBar score={score} label={label} breakdown={breakdown} />
          </section>

          {/* AI Analysis */}
          {cie?.agent1_detection?.description && (
            <section>
              <h2 className="text-xs font-semibold text-civic-muted uppercase tracking-wider mb-3">
                ✨ AI Analysis
              </h2>
              <div className="bg-blue-50 rounded-card p-4 border border-blue-100">
                <p className="text-sm text-civic-text leading-relaxed italic">
                  "{cie.agent1_detection.description}"
                </p>
                {cie.agent1_detection.confidence && (
                  <p className="text-xs text-civic-blue mt-2 font-mono">
                    Confidence: {Math.round(cie.agent1_detection.confidence * 100)}%
                  </p>
                )}
                {cie.agent4_routing?.routing_reason && (
                  <p className="text-xs text-civic-muted mt-1">
                    Routing: {cie.agent4_routing.routing_reason}
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Tags */}
          {cie?.agent5_insight?.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {cie.agent5_insight.tags.map((tag) => (
                <span key={tag} className="text-xs bg-civic-surface text-civic-muted px-2 py-1 rounded-pill border border-civic-border">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Community verification */}
          <section>
            <h2 className="text-xs font-semibold text-civic-muted uppercase tracking-wider mb-3">
              Community Verification
            </h2>
            <div className="bg-white rounded-card border border-civic-border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-civic-muted">
                  {issue.verificationCount || 0} / 10 verifications
                </span>
                <span className="text-sm text-civic-muted">
                  {issue.upvotes || 0} upvotes
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-civic-green rounded-full transition-all"
                  style={{ width: `${Math.min((issue.verificationCount || 0) / 10 * 100, 100)}%` }}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleVote('VERIFY')}
                  className="flex-1 bg-civic-green text-white rounded-btn py-2 text-sm font-semibold hover:bg-green-700 transition-colors"
                >
                  ✅ Verify this issue
                </button>
                <button
                  onClick={() => handleVote('UPVOTE')}
                  className="flex-1 border border-civic-border rounded-btn py-2 text-sm font-medium hover:bg-civic-surface transition-colors"
                >
                  ▲ Upvote
                </button>
              </div>
            </div>
          </section>

          {/* AI Timeline */}
          {issue.aiTimeline?.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-civic-muted uppercase tracking-wider mb-4">
                📅 AI-Enriched Timeline
              </h2>
              <AITimeline stages={issue.aiTimeline} />
            </section>
          )}

          {/* Duplicate notice */}
          {cie?.agent2_duplicate?.is_duplicate && (
            <div className="bg-amber-50 border border-amber-200 rounded-card p-4 text-sm">
              <p className="font-semibold text-amber-800 mb-1">🔗 Merged with existing issue</p>
              <p className="text-amber-700">{cie.agent2_duplicate.merge_reason}</p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
