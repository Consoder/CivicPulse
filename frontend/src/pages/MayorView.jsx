/**
 * Mayor View — AI Civic Operations Briefing (Scene 4)
 * ==========================================
 * Cinematic command-center aesthetic.
 * Calls /api/ai/mayor-insights/live to get a fresh AI briefing.
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchMayorBriefingLive } from '../services/api'
import useStore from '../store/useStore'
import { cn } from '../lib/utils'

const RISK_COLORS = {
  LOW:      { text: '#34A853', bg: '#E6F4EA' },
  MEDIUM:   { text: '#B06000', bg: '#FEF7E0' },
  HIGH:     { text: '#B24000', bg: '#FDE8D8' },
  CRITICAL: { text: '#C5221F', bg: '#FCE8E6' },
}

const DIRECTION_META = {
  UP:     { icon: '↑', color: '#EA4335' },
  DOWN:   { icon: '↓', color: '#34A853' },
  STABLE: { icon: '→', color: '#5F6368' },
}

function DeptBar({ dept, count, max, index }) {
  const pct = max > 0 ? (count / max) * 100 : 0
  const overloaded = count > 8
  
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 + (index * 0.1) }}
      className="flex items-center gap-4 py-2 group"
    >
      <span className="text-xs font-mono text-white/50 group-hover:text-white/80 w-16 shrink-0 transition-colors uppercase tracking-wider">{dept}</span>
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden relative">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: 0.8 + (index * 0.1), duration: 1, ease: 'easeOut' }}
          className={cn("absolute inset-y-0 left-0 rounded-full", overloaded ? 'bg-red-500' : 'bg-cie-primary')}
        />
        {overloaded && (
          <motion.div 
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-red-500/20"
          />
        )}
      </div>
      <span className={cn('text-xs font-mono w-8 text-right', overloaded ? 'text-red-400 font-bold' : 'text-white/70')}>
        {count}
      </span>
    </motion.div>
  )
}

export default function MayorView() {
  const [briefing, setBriefing] = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  
  const cachedBriefing = useStore((s) => s.mayorBriefing)
  const setStored      = useStore((s) => s.setMayorBriefing)
  const activeCity     = useStore((s) => s.activeCity)

  const fetchBriefing = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchMayorBriefingLive(24)
      setBriefing(data)
      setStored(data)
    } catch (err) {
      setError(err.message || 'Failed to generate briefing.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (cachedBriefing) {
      setBriefing(cachedBriefing)
    } else {
      fetchBriefing()
    }
  }, [])

  const deptMax = briefing
    ? Math.max(...Object.values(briefing.department_load || {}), 1)
    : 1

  return (
    <div className="min-h-screen bg-black text-white pt-16 pb-8 relative overflow-hidden">
      
      {/* Ambient background glow reflecting city stress */}
      <motion.div 
        animate={{ opacity: [0.1, 0.15, 0.1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 right-0 w-[800px] h-[800px] bg-red-900/10 blur-[150px] rounded-full pointer-events-none"
      />
      <motion.div 
        animate={{ opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cie-primary/10 blur-[150px] rounded-full pointer-events-none"
      />

      <div className="max-w-4xl mx-auto px-6 py-8 relative z-10">

        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 flex items-end justify-between"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-cie-primary animate-pulse" />
              <span className="text-xs font-mono text-cie-primary uppercase tracking-widest">Active Neural Link</span>
            </div>
            <h1 className="font-display text-4xl font-light tracking-tight text-white/90">
              Operations Briefing
            </h1>
            <p className="text-white/40 mt-2 font-mono text-xs uppercase tracking-widest">
              {activeCity} District · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
            </p>
          </div>
          
          <button
            onClick={fetchBriefing}
            disabled={loading}
            className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-white/50 hover:text-white transition-colors disabled:opacity-40"
          >
            {loading ? (
              <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
            ) : '↻'}
            {loading ? 'Compiling...' : 'Refresh Intel'}
          </button>
        </motion.div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-900/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm mb-6 backdrop-blur-md">
            {error}
          </motion.div>
        )}

        {!briefing && !loading && !error && (
          <div className="text-center py-32 opacity-30">
            <div className="w-16 h-16 mx-auto border border-white/20 rounded-full animate-pulse" />
          </div>
        )}

        {briefing && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Left Column: High Level Summary */}
            <div className="md:col-span-8 space-y-6">
              
              {/* Stats Row */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-3 gap-4"
              >
                {[
                  { label: 'Active Reports', value: briefing.total_open_issues, color: 'text-white' },
                  { label: 'Critical Stress', value: briefing.total_critical, color: 'text-red-400', pulse: true },
                  { label: 'Healed Today', value: briefing.duplicates_merged_today, color: 'text-cie-primary' },
                ].map(({ label, value, color, pulse }, i) => (
                  <div key={label} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className={cn("font-display text-4xl font-light mb-1", color, pulse && "animate-pulse")}>
                      {value}
                    </div>
                    <div className="text-xs font-mono text-white/40 uppercase tracking-wider">{label}</div>
                  </div>
                ))}
              </motion.div>

              {/* AI Summary */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-cie-primary/5 border border-cie-primary/20 rounded-2xl p-8 backdrop-blur-md relative"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-cie-primary rounded-l-2xl" />
                <p className="text-xs font-mono text-cie-primary uppercase tracking-widest mb-4">Executive Summary</p>
                <p className="text-white/80 text-sm leading-relaxed font-light">{briefing.summary}</p>
              </motion.div>

              {/* Hotspots (City Stress) */}
              {briefing.hotspots?.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 backdrop-blur-md"
                >
                  <p className="text-xs font-mono text-white/40 uppercase tracking-widest mb-6">Critical Stress Nodes</p>
                  <div className="space-y-4">
                    {briefing.hotspots.map((h, i) => {
                      const isCritical = h.risk_level === 'CRITICAL' || h.risk_level === 'HIGH'
                      return (
                        <div key={i} className="flex items-center justify-between group">
                          <div>
                            <span className={cn("font-light text-lg", isCritical ? "text-red-400" : "text-white/90")}>{h.area}</span>
                            <span className="text-white/30 text-xs font-mono ml-3 uppercase tracking-wider">{h.top_category}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-white/40 font-mono text-xs">{h.issue_count} TICKETS</span>
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: isCritical ? '#EA4335' : '#FBBC04' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}

            </div>

            {/* Right Column: Analytics & Workload */}
            <div className="md:col-span-4 space-y-6">
              
              {/* Department Workload */}
              {briefing.department_load && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 backdrop-blur-md"
                >
                  <p className="text-xs font-mono text-white/40 uppercase tracking-widest mb-6">Resource Allocation</p>
                  <div className="space-y-2">
                    {Object.entries(briefing.department_load).map(([dept, count], i) => (
                      <DeptBar key={dept} dept={dept} count={count} max={deptMax} index={i} />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Recommended Actions */}
              {briefing.recommended_actions?.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 backdrop-blur-md"
                >
                  <p className="text-xs font-mono text-white/40 uppercase tracking-widest mb-5">Tactical Advice</p>
                  <ul className="space-y-4">
                    {briefing.recommended_actions.map((action, i) => (
                      <li key={i} className="flex gap-3 text-sm text-white/70 font-light leading-relaxed">
                        <span className="text-cie-primary mt-1 opacity-50 text-xs">◆</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  )
}
