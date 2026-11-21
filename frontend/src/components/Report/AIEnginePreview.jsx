/**
 * AIEnginePreview - Civic Intelligence Engine (CIE)
 * Authentic progressive reasoning over 600-900ms.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CATEGORIES, PRIORITY_COLORS, DEPT_META, cn } from '../../lib/utils'

function ProgressiveRow({ label, value, delay, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.2, ease: "easeOut" }}
      className="flex items-start gap-3 py-3 border-b border-civic-border/50 last:border-0"
    >
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay + 0.1, type: 'spring' }}
        className="text-cie-secondary mt-0.5"
      >
        ✓
      </motion.div>
      <div className="flex-1">
        <div className="text-xs font-mono font-medium text-civic-muted tracking-wide mb-1">
          {label}
        </div>
        <div className="text-sm font-medium text-civic-text">
          {value}
        </div>
        {children}
      </div>
    </motion.div>
  )
}

export default function AIEnginePreview({ result, onComplete }) {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    if (!result || !result.agent1_detection.quality_pass) return
    // Authentic fast progressive disclosure
    const timers = [
      setTimeout(() => setStage(1), 150), // Image Quality
      setTimeout(() => setStage(2), 350), // Duplicate Search
      setTimeout(() => setStage(3), 550), // Priority Analysis
      setTimeout(() => setStage(4), 750), // Department Routing
      setTimeout(() => setStage(5), 900), // Mayor Insight
      setTimeout(() => {
        setStage(6)
        if(onComplete) onComplete(true)
      }, 1200)
    ]
    return () => timers.forEach(clearTimeout)
  }, [result, onComplete])

  if (!result) return null

  const { agent1_detection, agent2_duplicate, agent3_priority, agent4_routing, agent5_insight } = result
  const cat = CATEGORIES[agent1_detection.category] || CATEGORIES.OTHER
  const dept = DEPT_META[agent4_routing.department] || DEPT_META.OTHER
  const priorityColors = PRIORITY_COLORS[agent3_priority.priority_label] || PRIORITY_COLORS.MEDIUM

  if (!agent1_detection.quality_pass) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="mt-4 rounded-card border border-red-200 bg-red-50 p-4"
      >
        <p className="font-semibold text-red-800">Evidence Quality Failed</p>
        <p className="text-sm text-red-700">{agent1_detection.quality_feedback}</p>
        <button 
          onClick={() => onComplete && onComplete(false)}
          className="mt-3 px-4 py-2 bg-red-100 text-red-800 rounded-lg text-sm font-medium hover:bg-red-200"
        >
          Fill Manually
        </button>
      </motion.div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 relative overflow-hidden rounded-card bg-white shadow-cie"
    >
      {/* Background ambient CIE glow */}
      <div className="absolute inset-0 bg-cie-gradient opacity-[0.03] pointer-events-none" />
      
      {/* Scanning laser line */}
      {stage < 5 && (
        <motion.div 
          className="absolute left-0 right-0 h-0.5 bg-cie-gradient opacity-50 z-10"
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Header */}
      <div className="px-5 py-3 border-b border-civic-border flex items-center gap-2 bg-civic-surface/50">
        <span className="text-sm font-semibold cie-text">Civic Intelligence Engine</span>
        <span className="ml-auto text-xs font-mono text-civic-muted">
          v2.4
        </span>
      </div>

      <div className="px-5 pb-2 relative z-10">
        <AnimatePresence>
          {stage >= 1 && (
            <ProgressiveRow label="Image Quality Analysis" value={`Passed (${Math.round(agent1_detection.confidence * 100)}% Confidence)`} delay={0}>
               <span className="text-xs text-civic-muted mt-1 inline-block">{cat.emoji} Detected {cat.label}</span>
            </ProgressiveRow>
          )}

          {stage >= 2 && (
            <ProgressiveRow label="Duplicate Search" value={agent2_duplicate.is_duplicate ? 'Matches Issue #' + agent2_duplicate.duplicate_of.slice(0,8) : '0 nearby reports found'} delay={0}>
            </ProgressiveRow>
          )}

          {stage >= 3 && (
            <ProgressiveRow label="Priority Analysis" value="" delay={0}>
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-lg" style={{ color: priorityColors.text }}>{agent3_priority.priority_score}/100</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-pill uppercase tracking-wide" style={{ background: priorityColors.bg, color: priorityColors.text }}>
                  {agent3_priority.priority_label}
                </span>
              </div>
            </ProgressiveRow>
          )}

          {stage >= 4 && (
            <ProgressiveRow label="Department Routing" value={dept.label} delay={0} />
          )}

          {stage >= 5 && (
            <ProgressiveRow label="Mayor Insight" value={agent5_insight.insight_note} delay={0} />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
