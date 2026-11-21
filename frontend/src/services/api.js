/**
 * API service — all calls to the CivicPulse FastAPI backend.
 * Every function returns the parsed JSON response or throws an ApiError.
 */

import { auth } from './firebase'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// ─── ApiError ────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(status, message, detail) {
    super(message)
    this.status = status
    this.detail = detail
  }
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  let token = null
  try {
    token = await auth.currentUser?.getIdToken()
  } catch {
    // Firebase not configured or user not signed in — proceed without token
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.error || res.statusText, body.detail)
  }

  return res.json()
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI — Civic Intelligence Engine
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Run the 5-agent CIE pipeline on an image.
 * @param {string} imageBase64
 * @param {string} imageMimeType
 * @param {number} lat
 * @param {number} lng
 * @param {string} address
 * @param {number} upvoteCount
 * @param {Array}  nearbyIssues
 * @returns {Promise<CIEResponse>}
 */
export async function analyzeImage({
  imageBase64,
  imageMimeType = 'image/jpeg',
  lat,
  lng,
  address = '',
  upvoteCount = 0,
  nearbyIssues = [],
}) {
  return apiFetch('/api/ai/analyze', {
    method: 'POST',
    body: JSON.stringify({
      image_base64:    imageBase64,
      image_mime_type: imageMimeType,
      location_lat:    lat,
      location_lng:    lng,
      location_address: address,
      upvote_count:    upvoteCount,
      nearby_issues:   nearbyIssues,
    }),
  })
}

/**
 * Fetch the live Mayor briefing (auto-pulls issues from Firestore on the backend).
 * @param {number} timeframeHours
 */
export async function fetchMayorBriefingLive(timeframeHours = 24) {
  return apiFetch(`/api/ai/mayor-insights/live?timeframe_hours=${timeframeHours}`, {
    method: 'POST',
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// Issues
// ═══════════════════════════════════════════════════════════════════════════════

export async function createIssue(payload) {
  return apiFetch('/api/issues', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function listIssues({ status, category, department, page = 1, pageSize = 20 } = {}) {
  const params = new URLSearchParams()
  if (status)     params.set('status', status)
  if (category)   params.set('category', category)
  if (department) params.set('department', department)
  params.set('page', page)
  params.set('page_size', pageSize)
  return apiFetch(`/api/issues?${params}`)
}

export async function getIssue(issueId) {
  return apiFetch(`/api/issues/${issueId}`)
}

export async function updateIssueStatus(issueId, status) {
  return apiFetch(`/api/issues/${issueId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// Votes
// ═══════════════════════════════════════════════════════════════════════════════

export async function castVote(issueId, voteType) {
  return apiFetch('/api/votes', {
    method: 'POST',
    body: JSON.stringify({ issue_id: issueId, vote_type: voteType }),
  })
}

export async function getVotes(issueId) {
  return apiFetch(`/api/votes/${issueId}`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// Users
// ═══════════════════════════════════════════════════════════════════════════════

export async function syncUser() {
  return apiFetch('/api/users/sync', { method: 'POST' })
}

export async function getMe() {
  return apiFetch('/api/users/me')
}

export async function getLeaderboard(limit = 10) {
  return apiFetch(`/api/users/leaderboard?limit=${limit}`)
}
