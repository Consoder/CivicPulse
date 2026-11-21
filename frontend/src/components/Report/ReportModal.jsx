/**
 * ReportModal — The Signature WOW Moment.
 * Cinematic issue submission sequence.
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useStore from '../../store/useStore'
import { useCivicEngine } from '../../hooks/useCivicEngine'
import { createIssue } from '../../services/api'
import AIEnginePreview from './AIEnginePreview'
import { cn, extractExifGps } from '../../lib/utils'

export default function ReportModal() {
  const close    = useStore((s) => s.closeReportModal)
  const showToast = useStore((s) => s.showToast)

  // States: 'idle' -> 'analyzing' -> 'complete'
  const [phase, setPhase] = useState('idle')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loc, setLoc] = useState({ lat: 26.9124, lng: 75.7873, address: 'Auto-detected Location' })
  const [submitting, setSubmitting] = useState(false)
  const [manualData, setManualData] = useState({ title: '', description: '', category: 'OTHER' })

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLoc({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: 'Real-time GPS Location'
          })
        },
        (error) => {
          console.warn('Geolocation failed, falling back to default', error)
        }
      )
    }
  }, [])

  const inputRef = useRef()
  const { analyze, result: cieResult, loading: cieLoading, error: cieError, reset } = useCivicEngine()

  const handleFile = useCallback(async (f) => {
    if (!f || !f.type.startsWith('image/')) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setPhase('analyzing')
    reset()

    // Try to extract GPS from EXIF — auto-fills location if found
    const exifGps = await extractExifGps(f)
    const effectiveLoc = exifGps
      ? { lat: exifGps.lat, lng: exifGps.lng, address: `GPS: ${exifGps.lat.toFixed(5)}, ${exifGps.lng.toFixed(5)}` }
      : loc
    if (exifGps) setLoc(effectiveLoc)

    analyze(f, effectiveLoc)
  }, [analyze, loc, reset])

  const onDrop = (e) => {
    e.preventDefault()
    handleFile(e.dataTransfer.files[0])
  }

  const handleAIComplete = (success = true) => {
    if (success) {
      setPhase('complete')
    } else {
      setPhase('manual')
    }
  }

  const handleSubmit = async () => {
    if (!file || !cieResult) return
    setSubmitting(true)
    try {
      await createIssue({
        title: phase === 'manual' ? manualData.title : (cieResult.agent1_detection.short_title || 'Reported Issue'),
        description: phase === 'manual' ? manualData.description : (cieResult.agent1_detection.description || ''),
        category: phase === 'manual' ? manualData.category : (cieResult.agent1_detection.category || 'OTHER'),
        location: loc,
        image_urls: [], 
        cie_response: phase === 'manual' ? null : cieResult,
      })
      // Signal Propagation & Stress visualization would be triggered globally here via Zustand
      showToast('The city has reorganized around your report.', 'success')
      close()
    } catch (err) {
      showToast(err.message || 'Submission failed.', 'error')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Cinematic Backdrop that dims the city */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-md" 
        onClick={close} 
      />

      <motion.div 
        layoutId="report-modal"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-md bg-civic-surface/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <h2 className="font-display font-semibold text-lg text-civic-text tracking-tight">Civic Pulse Sensor</h2>
          <button onClick={close} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 text-civic-muted transition-colors">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <AnimatePresence mode="wait">
            {phase === 'idle' && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }}
                onDrop={onDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => inputRef.current?.click()}
                className="group relative border-2 border-dashed border-civic-border/60 bg-white/50 rounded-xl p-10 text-center cursor-pointer hover:border-cie-primary hover:bg-cie-primary/5 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-cie-gradient opacity-0 group-hover:opacity-5 transition-opacity rounded-xl" />
                <div className="w-16 h-16 mx-auto mb-4 bg-white shadow-sm rounded-full flex items-center justify-center border border-civic-border text-2xl group-hover:scale-110 transition-transform">
                  📷
                </div>
                <p className="font-medium text-civic-text text-lg">Transmit visual evidence</p>
                <p className="text-sm text-civic-muted mt-2">The Civic Intelligence Engine will analyze the scene.</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files[0])}
                />
              </motion.div>
            )}

            {(phase === 'analyzing' || phase === 'complete' || phase === 'manual') && (
              <motion.div key="analyzing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="relative rounded-xl overflow-hidden shadow-sm h-48 mb-6">
                  <img src={preview} alt="Evidence" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                    <span className="text-white text-sm font-mono tracking-wider drop-shadow-md flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cie-primary animate-pulse" />
                      {loc.address}
                    </span>
                  </div>
                </div>

                {cieError ? (
                  <div className="mt-4 rounded-card border border-red-200 bg-red-50 p-4">
                    <p className="font-semibold text-red-800">Connection Failed</p>
                    <p className="text-sm text-red-700">{cieError}</p>
                    <button 
                      onClick={() => setPhase('manual')}
                      className="mt-3 px-4 py-2 bg-red-100 text-red-800 rounded-lg text-sm font-medium hover:bg-red-200"
                    >
                      Fill Manually
                    </button>
                  </div>
                ) : (
                  phase === 'manual' ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-civic-muted mb-1">Issue Title</label>
                        <input 
                          type="text" 
                          value={manualData.title}
                          onChange={e => setManualData({...manualData, title: e.target.value})}
                          placeholder="e.g. Deep Pothole on Main St"
                          className="w-full bg-white/50 border border-civic-border rounded-lg px-3 py-2 text-civic-text focus:outline-none focus:border-cie-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-civic-muted mb-1">Category</label>
                        <select 
                          value={manualData.category}
                          onChange={e => setManualData({...manualData, category: e.target.value})}
                          className="w-full bg-white/50 border border-civic-border rounded-lg px-3 py-2 text-civic-text focus:outline-none focus:border-cie-primary"
                        >
                          <option value="POTHOLE">Pothole</option>
                          <option value="WATER_LEAKAGE">Water Leakage</option>
                          <option value="STREETLIGHT">Streetlight</option>
                          <option value="WASTE">Waste</option>
                          <option value="SEWAGE">Sewage</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-civic-muted mb-1">Description</label>
                        <textarea 
                          value={manualData.description}
                          onChange={e => setManualData({...manualData, description: e.target.value})}
                          placeholder="Provide details..."
                          rows={3}
                          className="w-full bg-white/50 border border-civic-border rounded-lg px-3 py-2 text-civic-text focus:outline-none focus:border-cie-primary"
                        />
                      </div>
                    </motion.div>
                  ) : (
                    <AIEnginePreview result={cieResult} onComplete={handleAIComplete} />
                  )
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer actions morph based on phase */}
        <div className="px-6 py-5 border-t border-white/10 bg-white/50 backdrop-blur-md">
          <AnimatePresence mode="wait">
            {phase === 'analyzing' && !cieError && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center py-2">
                <span className="cie-text animate-pulse">Initializing city integration...</span>
              </motion.div>
            )}
            
            {(phase === 'complete' || phase === 'manual') && (
              <motion.button
                key="submit"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                onClick={handleSubmit}
                disabled={submitting || (phase === 'manual' && !manualData.title)}
                className="w-full bg-civic-text text-white rounded-xl py-3.5 text-sm font-semibold tracking-wide hover:bg-black transition-colors shadow-lg relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-cie-gradient opacity-0 group-hover:opacity-20 transition-opacity" />
                {submitting ? 'Integrating...' : 'Integrate into City Network'}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
