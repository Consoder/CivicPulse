import { useMemo } from 'react'
import { Polyline, LayerGroup } from 'react-leaflet'

export default function DuplicateNetwork({ issues = [] }) {
  // Find issues that are duplicates of another issue and draw lines
  const lines = useMemo(() => {
    const network = []
    
    // Create a lookup for fast access
    const issueMap = new Map(issues.map(i => [i.id, i]))

    issues.forEach(issue => {
      // If this issue is marked as a duplicate of another issue
      if (issue.duplicateOf && issue.location) {
        const parent = issueMap.get(issue.duplicateOf)
        if (parent && parent.location) {
          network.push({
            id: `${issue.id}-${parent.id}`,
            positions: [
              [issue.location.lat, issue.location.lng],
              [parent.location.lat, parent.location.lng]
            ]
          })
        }
      }
    })
    
    return network
  }, [issues])

  return (
    <LayerGroup>
      {lines.map(line => (
        <Polyline 
          key={line.id}
          positions={line.positions}
          pathOptions={{
            color: '#3b82f6', // blue-500
            weight: 2,
            opacity: 0.6,
            dashArray: '4 8',
            className: 'animate-[dash_2s_linear_infinite]'
          }}
        />
      ))}
    </LayerGroup>
  )
}
