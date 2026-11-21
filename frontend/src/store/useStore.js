/**
 * Global Zustand store.
 * Split into slices: auth, issues, ui, environment.
 * Keep derived state in components via selectors — don't overload the store.
 */

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

const useStore = create(
  subscribeWithSelector((set, get) => ({
    // ── Environment (Spatial Context) ─────────────────────────────────────────
    activeCity: 'bengaluru', // default for demo
    setActiveCity: (city) => set({ activeCity: city }),

    // ── Auth ──────────────────────────────────────────────────────────────────
    firebaseUser: null,    // Firebase Auth user object
    profile: null,         // Firestore user profile (points, badge etc.)
    authLoading: true,

    setFirebaseUser: (user) => set({ firebaseUser: user }),
    setProfile: (profile)   => set({ profile }),
    setAuthLoading: (v)     => set({ authLoading: v }),

    // ── Issues ────────────────────────────────────────────────────────────────
    issues: [],            // Realtime list from Firestore
    issuesLoading: true,
    selectedIssueId: null, // Map pin / drawer

    setIssues:         (issues)  => set({ issues, issuesLoading: false }),
    setIssuesLoading:  (v)       => set({ issuesLoading: v }),
    setSelectedIssueId: (id)     => set({ selectedIssueId: id }),

    // ── Filters ───────────────────────────────────────────────────────────────
    filterCategory: null,
    filterStatus:   null,

    setFilterCategory: (v) => set({ filterCategory: v }),
    setFilterStatus:   (v) => set({ filterStatus: v }),

    get filteredIssues() {
      const { issues, filterCategory, filterStatus } = get()
      return issues.filter((i) => {
        if (filterCategory && i.category !== filterCategory) return false
        if (filterStatus   && i.status   !== filterStatus)   return false
        return true
      })
    },

    // ── Mayor briefing ────────────────────────────────────────────────────────
    mayorBriefing: null,
    mayorBriefingLoading: false,

    setMayorBriefing: (b) => set({ mayorBriefing: b }),
    setMayorBriefingLoading: (v) => set({ mayorBriefingLoading: v }),

    // ── UI ────────────────────────────────────────────────────────────────────
    reportModalOpen: false,
    toast: null,           // { message, type: 'success' | 'error' | 'info' }

    openReportModal:  () => set({ reportModalOpen: true }),
    closeReportModal: () => set({ reportModalOpen: false }),

    showToast: (message, type = 'info') => {
      set({ toast: { message, type } })
      setTimeout(() => set({ toast: null }), 4000)
    },
    clearToast: () => set({ toast: null }),
  }))
)

export default useStore
