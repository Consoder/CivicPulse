/**
 * Application-wide constants and utility functions.
 * Pure functions only — no React imports here.
 */

// ─── Category metadata ────────────────────────────────────────────────────────

export const CATEGORIES = {
  POTHOLE:       { label: 'Pothole',       emoji: '🕳️',  pinColor: '#FF8C00' },
  WATER_LEAKAGE: { label: 'Water Leakage', emoji: '💧',  pinColor: '#1A73E8' },
  STREETLIGHT:   { label: 'Streetlight',   emoji: '💡',  pinColor: '#FBBC04' },
  WASTE:         { label: 'Waste',         emoji: '🗑️',  pinColor: '#34A853' },
  SEWAGE:        { label: 'Sewage',        emoji: '🚧',  pinColor: '#EA4335' },
  OTHER:         { label: 'Other',         emoji: '❓',  pinColor: '#9AA0A6' },
}

// ─── Priority score ───────────────────────────────────────────────────────────

export const PRIORITY_COLORS = {
  LOW:      { bg: '#E6F4EA', text: '#137333', bar: '#34A853' },
  MEDIUM:   { bg: '#FEF7E0', text: '#B06000', bar: '#FBBC04' },
  HIGH:     { bg: '#FDE8D8', text: '#B24000', bar: '#FF8C00' },
  CRITICAL: { bg: '#FCE8E6', text: '#C5221F', bar: '#EA4335' },
}

export function priorityColor(score) {
  if (score >= 81) return PRIORITY_COLORS.CRITICAL
  if (score >= 61) return PRIORITY_COLORS.HIGH
  if (score >= 31) return PRIORITY_COLORS.MEDIUM
  return PRIORITY_COLORS.LOW
}

export function priorityLabel(score) {
  if (score >= 81) return 'CRITICAL'
  if (score >= 61) return 'HIGH'
  if (score >= 31) return 'MEDIUM'
  return 'LOW'
}

// ─── Status metadata ──────────────────────────────────────────────────────────

export const STATUS_META = {
  REPORTED:    { label: 'Reported',     bg: '#E8F0FE', text: '#1A73E8' },
  VERIFIED:    { label: 'Verified',     bg: '#E6F4EA', text: '#137333' },
  IN_PROGRESS: { label: 'In Progress',  bg: '#FEF7E0', text: '#B06000' },
  RESOLVED:    { label: 'Resolved',     bg: '#E6F4EA', text: '#137333' },
}

// ─── Badge metadata ───────────────────────────────────────────────────────────

export const BADGE_META = {
  NEWCOMER:   { label: 'Newcomer',    emoji: '🌱', minPts: 0 },
  WATCHDOG:   { label: 'Watchdog',    emoji: '👁️', minPts: 51 },
  REPORTER:   { label: 'Reporter',    emoji: '📢', minPts: 201 },
  CIVIC_HERO: { label: 'Civic Hero',  emoji: '🦸', minPts: 500 },
}

// ─── Department metadata ──────────────────────────────────────────────────────

export const DEPT_META = {
  PWD:    { label: 'Public Works',         short: 'PWD' },
  JVVNL:  { label: 'Water & Power',        short: 'JVVNL' },
  JMC:    { label: 'Municipal Corp',       short: 'JMC' },
  DISCOM: { label: 'Power Distribution',   short: 'DISCOM' },
  OTHER:  { label: 'Other',               short: 'Other' },
}

// ─── Time helpers ─────────────────────────────────────────────────────────────

export function timeAgo(isoString) {
  if (!isoString) return ''
  const diff = Date.now() - new Date(isoString).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export function formatDate(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

// ─── Image helpers ────────────────────────────────────────────────────────────

/** Convert a File to base64 string (no data: prefix). */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/** Convert a File's MIME type to the accepted backend format. */
export function fileMimeType(file) {
  const type = file.type
  if (['image/jpeg', 'image/png', 'image/webp'].includes(type)) return type
  return 'image/jpeg'
}

/** Extract GPS coordinates from a photo's EXIF data. Returns {lat, lng} or null. */
export async function extractExifGps(file) {
  try {
    const exifr = (await import('exifr')).default
    const gps = await exifr.gps(file)
    if (gps && gps.latitude && gps.longitude) {
      return { lat: gps.latitude, lng: gps.longitude }
    }
    return null
  } catch {
    return null
  }
}

/** Return "Good morning", "Good afternoon", or "Good evening" based on current hour. */
export function timeGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// ─── Geo helpers ──────────────────────────────────────────────────────────────

/** Haversine distance in metres between two lat/lng pairs. */
export function distanceMetres(lat1, lng1, lat2, lng2) {
  const R = 6_371_000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── clsx shim (if not using the package) ────────────────────────────────────

export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
