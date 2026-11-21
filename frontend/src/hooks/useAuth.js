/**
 * useAuth — Firebase auth state + backend sync.
 * Call once at the top of App.jsx. State lives in Zustand.
 */

import { useEffect } from 'react'
import { onAuthChange } from '../services/firebase'
import { syncUser, getMe } from '../services/api'
import useStore from '../store/useStore'

export function useAuth() {
  const setFirebaseUser = useStore((s) => s.setFirebaseUser)
  const setProfile      = useStore((s) => s.setProfile)
  const setAuthLoading  = useStore((s) => s.setAuthLoading)

  useEffect(() => {
    const unsub = onAuthChange(async (fbUser) => {
      setFirebaseUser(fbUser)
      setAuthLoading(false)

      if (fbUser) {
        try {
          // Sync to Firestore and get enriched profile (points, badge)
          const profile = await syncUser()
          setProfile(profile)
        } catch (err) {
          console.error('Profile sync failed:', err)
        }
      } else {
        setProfile(null)
      }
    })

    return unsub
  }, [])

  return {
    user:    useStore((s) => s.firebaseUser),
    profile: useStore((s) => s.profile),
    loading: useStore((s) => s.authLoading),
  }
}
