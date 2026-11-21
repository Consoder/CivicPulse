import { Link, useLocation } from 'react-router-dom'
import { signInWithGoogle, signOut } from '../../services/firebase'
import useStore from '../../store/useStore'
import { BADGE_META, cn } from '../../lib/utils'

const NAV_LINKS = [
  { to: '/',          label: 'Map' },
  { to: '/feed',      label: 'Feed' },
  { to: '/mayor',     label: '🧠 Mayor AI' },
  { to: '/dashboard', label: 'Dashboard' },
]

export default function Navbar() {
  const location = useLocation()
  const user     = useStore((s) => s.firebaseUser)
  const profile  = useStore((s) => s.profile)
  const openReportModal = useStore((s) => s.openReportModal)

  const badge = profile ? BADGE_META[profile.badge] : null

  return (
    <header className="fixed top-0 inset-x-0 z-50 h-14 bg-white border-b border-civic-border flex items-center px-4 gap-4 shadow-map">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 shrink-0">
        <span className="text-civic-blue font-display font-bold text-lg leading-none">
          Civic<span className="text-civic-green">Pulse</span>
        </span>
        <span className="hidden sm:inline text-xs text-civic-muted font-mono bg-civic-surface px-1.5 py-0.5 rounded-pill">
          AI OPS
        </span>
      </Link>

      {/* Nav links */}
      <nav className="hidden md:flex items-center gap-1 ml-2">
        {NAV_LINKS.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              'px-3 py-1.5 rounded-btn text-sm font-medium transition-colors',
              location.pathname === to
                ? 'bg-blue-50 text-civic-blue'
                : 'text-civic-muted hover:text-civic-text hover:bg-civic-surface',
            )}
          >
            {label}
          </Link>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-3">
        {/* Report FAB (desktop inline) */}
        <button
          onClick={openReportModal}
          className="hidden sm:flex items-center gap-2 bg-civic-blue text-white px-4 py-1.5 rounded-btn text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <span>+</span> Report Issue
        </button>

        {/* Auth */}
        {user ? (
          <button
            onClick={signOut}
            className="flex items-center gap-2 group"
            title={`${profile?.display_name} · ${profile?.points ?? 0} pts`}
          >
            <img
              src={user.photoURL || ''}
              alt={user.displayName || ''}
              className="w-8 h-8 rounded-full border-2 border-civic-border group-hover:border-civic-blue transition-colors"
            />
            {badge && (
              <span className="hidden md:inline text-base" title={badge.label}>
                {badge.emoji}
              </span>
            )}
          </button>
        ) : (
          <button
            onClick={signInWithGoogle}
            className="flex items-center gap-2 border border-civic-border rounded-btn px-3 py-1.5 text-sm font-medium hover:bg-civic-surface transition-colors"
          >
            <img src="https://www.google.com/favicon.ico" alt="" className="w-4 h-4" />
            Sign in
          </button>
        )}
      </div>
    </header>
  )
}
