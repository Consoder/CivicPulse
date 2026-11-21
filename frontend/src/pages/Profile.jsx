/**
 * Profile — User profile page.
 * Shows: avatar, badge, points breakdown, reported issues list.
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithGoogle } from '../services/firebase'
import { getMe } from '../services/api'
import useStore from '../store/useStore'
import IssueCard from '../components/Issue/IssueCard'
import { BADGE_META } from '../lib/utils'

// ─── Points progress bar ──────────────────────────────────────────────────────
function PointsProgress({ points }) {
  const TIERS = [
    { badge: 'NEWCOMER',   min: 0,   max: 50,  emoji: '🌱' },
    { badge: 'WATCHDOG',   min: 51,  max: 200, emoji: '👁️' },
    { badge: 'REPORTER',   min: 201, max: 500, emoji: '📢' },
    { badge: 'CIVIC_HERO', min: 501, max: 999, emoji: '🦸' },
  ]

  const current = [...TIERS].reverse().find((t) => points >= t.min) || TIERS[0]
  const next    = TIERS[TIERS.indexOf(current) + 1]

  const pct = next
    ? Math.min(((points - current.min) / (next.min - current.min)) * 100, 100)
    : 100

  return (
    <div className="bg-white rounded-card border border-civic-border p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-civic-muted">
          {current.emoji} {BADGE_META[current.badge]?.label}
        </span>
        {next && (
          <span className="text-sm text-civic-muted">
            {next.emoji} {BADGE_META[next.badge]?.label}
          </span>
        )}
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-civic-blue rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-civic-muted text-center">
        {next
          ? `${points} / ${next.min} pts to ${BADGE_META[next.badge]?.label}`
          : '🦸 Max badge achieved!'}
      </p>
    </div>
  )
}

// ─── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({ value, label }) {
  return (
    <div className="flex-1 bg-white rounded-card border border-civic-border p-3 text-center">
      <div className="font-mono text-2xl font-bold text-civic-text">{value}</div>
      <div className="text-xs text-civic-muted mt-0.5">{label}</div>
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function Profile() {
  const navigate  = useNavigate()
  const fbUser    = useStore((s) => s.firebaseUser)
  const issues    = useStore((s) => s.issues)
  const authLoading = useStore((s) => s.authLoading)

  const [profile, setProfile] = useState(useStore.getState().profile)

  useEffect(() => {
    if (fbUser) {
      getMe().then(setProfile).catch(console.error)
    }
  }, [fbUser])

  // Issues reported by this user
  const myIssues = issues.filter((i) => i.reportedBy === fbUser?.uid)

  // Not logged in
  if (!authLoading && !fbUser) {
    return (
      <div className="page-scroll flex flex-col items-center justify-center h-full text-center px-8">
        <p className="text-5xl mb-4">🌱</p>
        <h2 className="font-display text-xl font-bold text-civic-text mb-2">Your civic journey starts here</h2>
        <p className="text-sm text-civic-muted mb-6">Sign in to track your reports, earn points, and climb the leaderboard.</p>
        <button
          onClick={signInWithGoogle}
          className="flex items-center gap-2 bg-civic-blue text-white px-6 py-3 rounded-btn font-semibold text-sm hover:bg-blue-700 transition-colors"
        >
          <img src="https://www.google.com/favicon.ico" alt="" className="w-4 h-4" />
          Sign in with Google
        </button>
      </div>
    )
  }

  if (authLoading || !profile) {
    return (
      <div className="page-scroll flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-civic-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const badge = BADGE_META[profile.badge] || BADGE_META.NEWCOMER

  return (
    <div className="page-scroll">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Profile header */}
        <div className="bg-white rounded-card shadow-card p-6 flex items-center gap-5">
          <img
            src={fbUser.photoURL || ''}
            alt={profile.display_name}
            className="w-16 h-16 rounded-full border-2 border-civic-blue"
          />
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-xl font-bold text-civic-text">{profile.display_name}</h1>
            <p className="text-civic-muted text-sm">{profile.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-lg">{badge.emoji}</span>
              <span className="font-semibold text-civic-text">{badge.label}</span>
              <span className="text-civic-muted text-sm">·</span>
              <span className="font-mono font-bold text-civic-blue">{profile.points} pts</span>
            </div>
          </div>
        </div>

        {/* Points progress */}
        <PointsProgress points={profile.points} />

        {/* Stats */}
        <div className="flex gap-3">
          <StatPill value={profile.issues_reported} label="Reported" />
          <StatPill value={profile.issues_verified} label="Verified" />
          <StatPill value={profile.issues_resolved} label="Resolved" />
        </div>

        {/* Points breakdown */}
        <div className="bg-white rounded-card shadow-card p-5">
          <h3 className="font-semibold text-civic-text mb-4">How to earn points</h3>
          <div className="space-y-2 text-sm">
            {[
              { action: 'Report an issue',              pts: '+10' },
              { action: 'Pass AI quality gate',         pts: '+5' },
              { action: 'Verify someone\'s issue',      pts: '+5' },
              { action: 'Issue gets 3+ verifications',  pts: '+15' },
              { action: 'Issue gets resolved',          pts: '+25' },
              { action: 'First report in a new area',   pts: '+20' },
              { action: 'Duplicate merge contribution', pts: '+10' },
            ].map(({ action, pts }) => (
              <div key={action} className="flex items-center justify-between py-1.5 border-b border-civic-border last:border-0">
                <span className="text-civic-muted">{action}</span>
                <span className="font-mono font-semibold text-civic-green">{pts}</span>
              </div>
            ))}
          </div>
        </div>

        {/* My issues */}
        {myIssues.length > 0 && (
          <div>
            <h2 className="font-semibold text-civic-text mb-3">My Reports ({myIssues.length})</h2>
            <div className="space-y-4">
              {myIssues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  onClick={(id) => navigate(`/issues/${id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {myIssues.length === 0 && (
          <div className="text-center py-10 text-civic-muted">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-sm">No reports yet. Be the first to report an issue!</p>
          </div>
        )}

      </div>
    </div>
  )
}
