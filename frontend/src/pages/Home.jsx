/**
 * Home page - The Living City
 * Scene 1: The Awakening (0-15s)
 * The city wakes up, road networks illuminate, AI briefing fades in.
 */

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../store/useStore'
import CivicMap from '../components/map/CivicMap'
import { timeGreeting } from '../lib/utils'

export default function Home() {
  // Sequence stages: 'dark' -> 'ambient' -> 'scan' -> 'briefing' -> 'map'
  const [stage, setStage] = useState('dark')
  
  const issues = useStore((s) => s.issues)
  const openModal = useStore((s) => s.openReportModal)
  const activeCity = useStore((s) => s.activeCity)

  // The Awakening Choreography
  useEffect(() => {
    const sequence = [
      setTimeout(() => setStage('ambient'), 1000),
      setTimeout(() => setStage('scan'), 3000),
      setTimeout(() => setStage('briefing'), 4500),
      setTimeout(() => setStage('map'), 8000),
    ]
    return () => sequence.forEach(clearTimeout)
  }, [])

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      
      {/* ── MAP ENGINE LAYER (Reveals slowly) ── */}
      <motion.div 
        className="absolute inset-0 z-0"
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ 
          opacity: stage === 'map' ? 1 : stage === 'briefing' ? 0.3 : 0,
          scale: stage === 'map' ? 1 : 1.05
        }}
        transition={{ duration: 4, ease: "easeInOut" }}
      >
        <CivicMap issues={issues} activeCity={activeCity} />
      </motion.div>

      {/* ── CINEMATIC OVERLAYS ── */}
      <AnimatePresence>
        
        {/* The AI Pulse Scan */}
        {stage === 'scan' && (
          <motion.div 
            initial={{ left: '-100%' }}
            animate={{ left: '200%' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, ease: 'linear' }}
            className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-cie-primary/20 to-transparent blur-3xl z-20 skew-x-12"
          />
        )}

        {/* The Awakening Briefing */}
        {(stage === 'briefing' || stage === 'scan') && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: 'blur(10px)' }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center px-6 pointer-events-none"
          >
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="text-cie-primary mb-4"
            >
              <div className="w-12 h-12 mx-auto rounded-full shadow-cie-glow border border-cie-primary/50 flex items-center justify-center">
                <div className="w-2 h-2 bg-cie-primary rounded-full animate-pulse" />
              </div>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1.5 }}
              className="font-display text-4xl font-light text-white tracking-tight mb-3"
            >
              {timeGreeting()}.
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.5, duration: 1.5 }}
              className="text-white/70 text-lg font-light"
            >
              The Civic Intelligence Engine analyzed <span className="text-white font-medium">{issues.length}</span> civic reports overnight.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── UI LAYER (Reveals last) ── */}
      <AnimatePresence>
        {stage === 'map' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1 }}
            className="absolute inset-0 pointer-events-none z-40"
          >
            {/* Top Stats Bar */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-4 pointer-events-auto">
              <div className="bg-black/40 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-full shadow-lg flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-cie-primary animate-pulse" />
                <span className="text-white/90 text-sm font-medium tracking-wide">City Network Active</span>
              </div>
            </div>

            {/* FAB — Report */}
            <button
              onClick={openModal}
              className="absolute bottom-10 right-10 z-10 w-16 h-16 bg-cie-primary text-white rounded-full shadow-cie-glow flex items-center justify-center text-3xl hover:bg-blue-600 transition-colors pointer-events-auto active:scale-95 group overflow-hidden"
              aria-label="Report issue"
            >
              <div className="absolute inset-0 bg-cie-gradient opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10">+</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
