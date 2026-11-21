/**
 * App root — router, auth init, global realtime subscription.
 * Spatial Civic Operating System Architecture.
 */

import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/shared/Navbar'
import ReportModal from './components/Report/ReportModal'
import AtmosphereCanvas from './components/shared/AtmosphereCanvas'
import { useAuth } from './hooks/useAuth'
import { useIssues } from './hooks/useIssues'
import useStore from './store/useStore'

// Eager-load the two most-visited pages
import Home      from './pages/Home'
import MayorView from './pages/MayorView'

// Lazy-load the rest to keep initial bundle small
const IssueFeed   = lazy(() => import('./pages/IssueFeed'))
const IssueDetail = lazy(() => import('./pages/IssueDetail'))
const Dashboard   = lazy(() => import('./pages/Dashboard'))
const Profile     = lazy(() => import('./pages/Profile'))

// ─── Shared loaders / primitives ─────────────────────────────────────────────

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 rounded-full border-t-2 border-cie-primary shadow-cie-glow animate-spin" />
    </div>
  )
}

function Toast() {
  const toast      = useStore((s) => s.toast)
  const clearToast = useStore((s) => s.clearToast)

  if (!toast) return null

  const colorMap = {
    success: 'bg-civic-green',
    error:   'bg-civic-red',
    info:    'bg-civic-dark',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      role="status"
      aria-live="polite"
      onClick={clearToast}
      className={`
        fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]
        px-5 py-3 rounded-card shadow-modal
        text-white text-sm font-medium cursor-pointer
        select-none
        ${colorMap[toast.type] || colorMap.info}
      `}
    >
      {toast.message}
    </motion.div>
  )
}

// ─── Animated Router Setup ───────────────────────────────────────────────────

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/"           element={<motion.div className="h-full" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><Home /></motion.div>} />
        <Route path="/feed"       element={<motion.div className="h-full" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><IssueFeed /></motion.div>} />
        <Route path="/issues/:id" element={<motion.div className="h-full" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><IssueDetail /></motion.div>} />
        <Route path="/dashboard"  element={<motion.div className="h-full" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><Dashboard /></motion.div>} />
        <Route path="/mayor"      element={<motion.div className="h-full" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><MayorView /></motion.div>} />
        <Route path="/profile"    element={<motion.div className="h-full" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}><Profile /></motion.div>} />
      </Routes>
    </AnimatePresence>
  )
}


// ─── App shell ────────────────────────────────────────────────────────────────

function AppShell() {
  useAuth()      // Firebase auth → Zustand
  useIssues()    // Firestore realtime → Zustand

  const reportModalOpen = useStore((s) => s.reportModalOpen)
  const activeCity = useStore((s) => s.activeCity)
  const toast = useStore((s) => s.toast)

  // Inject the environment DNA into the body for CSS variables
  useEffect(() => {
    document.body.setAttribute('data-city', activeCity)
  }, [activeCity])

  return (
    <div className="relative flex flex-col h-screen overflow-hidden font-sans bg-transparent">
      
      {/* LAYER 1: Living Environment */}
      <AtmosphereCanvas />

      {/* LAYER 2 & 3: Map Intelligence & Contextual Backgrounds 
          (These are handled inside specific pages like Home/MayorView) */}

      {/* LAYER 4: User Interaction / UI */}
      <div className="relative z-40 flex flex-col h-full pointer-events-none">
        {/* Navbar is pointer-events-auto */}
        <div className="pointer-events-auto">
          <Navbar />
        </div>

        <main className="flex-1 overflow-hidden mt-14 pointer-events-auto">
          <Suspense fallback={<PageLoader />}>
            <AnimatedRoutes />
          </Suspense>
        </main>
      </div>

      {/* LAYER 5: AI Reasoning / Modals */}
      <AnimatePresence>
        {reportModalOpen && <ReportModal />}
      </AnimatePresence>
      
      <AnimatePresence>
        {toast && <Toast />}
      </AnimatePresence>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
