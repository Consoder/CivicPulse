import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'

export default function HeatLayer({ issues = [] }) {
  const map = useMap()
  const heatLayerRef = useRef(null)

  useEffect(() => {
    if (!map) return

    // Extract intensity. Critical = hotter.
    const heatData = issues
      .filter(i => i.location?.lat && i.location?.lng)
      .map(i => {
        const intensity = i.priorityScore ? i.priorityScore / 100 : 0.5
        return [i.location.lat, i.location.lng, intensity * 2] 
      })

    if (!heatLayerRef.current) {
      heatLayerRef.current = L.heatLayer(heatData, {
        radius: 35,
        blur: 25,
        maxZoom: 15,
        gradient: {
          0.2: '#0ea5e9', // Sky blue
          0.4: '#3b82f6', // Blue
          0.6: '#f59e0b', // Amber
          0.8: '#ef4444', // Red
          1.0: '#991b1b'  // Dark Red
        }
      }).addTo(map)
    } else {
      heatLayerRef.current.setLatLngs(heatData)
    }

    // Optional: add a CSS class to the heat canvas to animate opacity (breathing effect)
    const canvas = heatLayerRef.current._canvas
    if (canvas) {
      canvas.classList.add('animate-heat-breathe')
    }

    return () => {
      // Cleanup on unmount
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current)
        heatLayerRef.current = null
      }
    }
  }, [issues, map])

  return null
}
