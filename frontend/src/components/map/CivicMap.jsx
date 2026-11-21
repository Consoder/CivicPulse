import { useEffect, useRef } from 'react'
import { MapContainer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

import CivicTileLayer from './TileLayer'
import IssueMarkers from './IssueMarkers'
import PulseLayer from './PulseLayer'
import HeatLayer from './HeatLayer'
import DuplicateNetwork from './DuplicateNetwork'
import AtmosphereLayer from './AtmosphereLayer'

const CITY_COORDS = {
  jaipur: { lat: 26.9124, lng: 75.7873, zoom: 13 },
  bengaluru: { lat: 12.9716, lng: 77.5946, zoom: 12 },
  kochi: { lat: 9.9312, lng: 76.2673, zoom: 13 }
}

/**
 * Intelligent Camera Hook
 * Handles cinematic easing and panning instead of raw flyTo()
 */
function MapController({ activeCity }) {
  const map = useMap()

  useEffect(() => {
    const coords = CITY_COORDS[activeCity] || CITY_COORDS.jaipur
    // Cinematic camera easing
    map.flyTo([coords.lat, coords.lng], coords.zoom, {
      animate: true,
      duration: 3.5,
      easeLinearity: 0.1,
    })
  }, [activeCity, map])

  return null
}

export default function CivicMap({ issues, activeCity }) {
  const coords = CITY_COORDS[activeCity] || CITY_COORDS.jaipur
  const center = [coords.lat, coords.lng]
  const zoom = coords.zoom

  return (
    <div className="relative w-full h-full bg-black overflow-hidden z-0">
      {/* 1. Ambient Atmosphere (CSS/Framer layer behind map) */}
      <AtmosphereLayer />

      {/* 2. Leaflet Engine */}
      <MapContainer
        center={center}
        zoom={zoom}
        zoomControl={false}
        className="w-full h-full z-10 !bg-transparent"
        style={{ background: 'transparent' }}
      >
        <MapController activeCity={activeCity} />

        {/* 3. Dark CARTO Tiles */}
        <CivicTileLayer />

        {/* 4. Heat Layer (Breathing density) */}
        <HeatLayer issues={issues} />

        {/* 5. Duplicate Network (SVG connections) */}
        <DuplicateNetwork issues={issues} />

        {/* 6. Animated Issue Markers */}
        <IssueMarkers issues={issues} />
      </MapContainer>

      {/* 7. Scan/Pulse Waves (Must be outside MapContainer) */}
      <PulseLayer />
    </div>
  )
}
