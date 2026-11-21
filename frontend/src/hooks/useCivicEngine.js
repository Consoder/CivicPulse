/**
 * useCivicEngine — wraps the POST /api/ai/analyze call.
 * Handles loading, error, and result state.
 */

import { useState, useCallback } from 'react'
import { analyzeImage } from '../services/api'
import { fileToBase64, fileMimeType, distanceMetres } from '../lib/utils'
import useStore from '../store/useStore'

export function useCivicEngine() {
  const [result,  setResult]  = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const issues = useStore((s) => s.issues)

  /**
   * Analyse an image file.
   * @param {File}   file     — image file from input / drag-drop
   * @param {number} lat
   * @param {number} lng
   * @param {string} address
   */
  const analyze = useCallback(async (file, { lat, lng, address } = {}) => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const imageBase64   = await fileToBase64(file)
      const imageMimeType = fileMimeType(file)

      // Build nearby issues context (within 500m of report location)
      const nearby = (lat && lng)
        ? issues
            .filter((i) => {
              const d = distanceMetres(lat, i.location?.lat, lng, i.location?.lng)
              return d <= 500 && i.status !== 'RESOLVED'
            })
            .slice(0, 10)
            .map((i) => ({
              id:         i.id,
              category:   i.category || 'OTHER',
              title:      i.title,
              lat:        i.location?.lat || 0,
              lng:        i.location?.lng || 0,
              upvotes:    i.upvotes || 0,
              created_at: i.createdAt || '',
            }))
        : []

      const cieResult = await analyzeImage({
        imageBase64,
        imageMimeType,
        lat:          lat || 0,
        lng:          lng || 0,
        address:      address || '',
        nearbyIssues: nearby,
      })

      setResult(cieResult)
      return cieResult
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.')
      return null
    } finally {
      setLoading(false)
    }
  }, [issues])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
    setLoading(false)
  }, [])

  return { analyze, result, loading, error, reset }
}
