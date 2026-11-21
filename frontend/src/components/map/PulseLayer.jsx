import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../../store/useStore'

export default function PulseLayer() {
  const isScanning = useStore(s => s.isScanning)
  const setScanning = useStore(s => s.setScanning)

  // Auto-hide scan after animation completes
  useEffect(() => {
    if (isScanning) {
      const timer = setTimeout(() => setScanning(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isScanning, setScanning])

  return (
    <div className="absolute inset-0 pointer-events-none z-[100] flex items-center justify-center overflow-hidden">
      <AnimatePresence>
        {isScanning && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: [0, 4, 8], opacity: [1, 0.5, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, ease: "easeOut" }}
            className="absolute rounded-full border-2 border-civic-accent/50 bg-civic-accent/10"
            style={{ width: '20vh', height: '20vh' }}
          >
            {/* Inner radar sweep effect */}
            <div className="w-full h-full rounded-full animate-spin-slow bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(59,130,246,0.3)_360deg)]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
