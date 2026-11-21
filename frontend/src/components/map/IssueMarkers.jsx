import { useMemo } from 'react'
import { Marker, LayerGroup } from 'react-leaflet'
import L from 'leaflet'

/**
 * Creates custom animated HTML markers using L.divIcon
 */
function createCustomIcon(issue) {
  // Base size and color logic
  const isCritical = issue.priorityScore >= 80
  const isResolved = issue.status === 'RESOLVED'
  
  let colorClass = 'bg-blue-500' // default
  let ringClass = ''
  let html = ''

  if (isResolved) {
    colorClass = 'bg-green-500'
    html = `
      <div class="relative w-4 h-4 rounded-full flex items-center justify-center">
        <div class="absolute inset-0 rounded-full ${colorClass} opacity-40 animate-pulse"></div>
        <div class="w-2 h-2 rounded-full ${colorClass} shadow-[0_0_8px_#22c55e]"></div>
      </div>
    `
  } else if (isCritical) {
    colorClass = 'bg-red-500'
    html = `
      <div class="relative w-6 h-6 rounded-full flex items-center justify-center">
        <div class="absolute inset-0 rounded-full border border-red-500 opacity-50 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
        <div class="absolute inset-1 rounded-full ${colorClass} opacity-30 animate-pulse"></div>
        <div class="w-2 h-2 rounded-full ${colorClass} shadow-[0_0_12px_#ef4444]"></div>
      </div>
    `
  } else {
    colorClass = 'bg-amber-500' // Medium
    html = `
      <div class="relative w-4 h-4 rounded-full flex items-center justify-center">
        <div class="absolute inset-0 rounded-full ${colorClass} opacity-20"></div>
        <div class="w-2 h-2 rounded-full ${colorClass} shadow-[0_0_6px_#f59e0b]"></div>
      </div>
    `
  }

  return L.divIcon({
    html,
    className: 'custom-leaflet-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

export default function IssueMarkers({ issues = [] }) {
  // Only recompute icons if issues array changes
  const markers = useMemo(() => {
    return issues.map(issue => {
      if (!issue.location?.lat || !issue.location?.lng) return null
      
      const icon = createCustomIcon(issue)
      
      return (
        <Marker 
          key={issue.id} 
          position={[issue.location.lat, issue.location.lng]} 
          icon={icon} 
        />
      )
    }).filter(Boolean)
  }, [issues])

  return <LayerGroup>{markers}</LayerGroup>
}
