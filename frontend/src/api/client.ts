import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/store/auth-store'
import { queryClient } from '@/lib/query-client'
import {
  getDeduplicationKey,
  isRequestInflight,
  markRequestInflight,
  clearInflightRequest,
} from '@/lib/duplicate-submission'

// ── Constants ──

const TOKEN_REFRESH_ENDPOINT = '/auth/refresh'
const RETRY_DELAY_MS = 2000
const REDIRECT_TIMEOUT_MS = 300

// ── State ──

/** Tracks whether a token refresh is currently in progress to avoid concurrent refreshes */
let isRefreshing = false
/** Queue of requests waiting for the token refresh to complete */
let refreshSubscribers: Array<(token: string | null) => void> = []

// ── Helpers ──

function subscribeToTokenRefresh(callback: (token: string | null) => void) {
  refreshSubscribers.push(callback)
}

function onTokenRefreshed(token: string | null) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

/**
 * Attempts a single token refresh. Returns the new token on success, or null on failure.
 * Requirement 27.5: Detect 401, attempt single refresh, retry failed request once.
 */
async function attemptTokenRefresh(): Promise<string | null> {
  try {
    const currentToken = useAuthStore.getState().token
    if (!currentToken) return null

    const response = await axios.post(
      `${apiClient.defaults.baseURL}${TOKEN_REFRESH_ENDPOINT}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const newToken = response.data?.token || response.data?.data?.token
    if (newToken) {
      // Update the auth store with the new token
      const { user } = useAuthStore.getState()
      if (user) {
        useAuthStore.getState().login(user, newToken)
      }
      return newToken
    }
    return null
  } catch {
    return null
  }
}

/**
 * Forces sign-out: clears auth state, clears TanStack Query cache, and redirects to login.
 * Requirement 26.2: Clear session and redirect within 300ms.
 * Requirement 27.6: Clear all role-specific cached data on auth → unauth transition.
 */
function forceSignOut() {
  const { isAuthenticated } = useAuthStore.getState()

  // Only clear cache if transitioning from authenticated to unauthenticated
  if (isAuthenticated) {
    // Clear all TanStack Query cache on auth → unauth transition (Req 27.6)
    queryClient.clear()
  }

  useAuthStore.getState().logout()

  // Redirect to login within 300ms (Req 26.2)
  setTimeout(() => {
    window.location.href = '/login'
  }, Math.min(REDIRECT_TIMEOUT_MS, 300))
}

/**
 * Delays execution for the specified duration.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ── Axios Instance ──

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Helpers: HTTPS Enforcement ──

/**
 * Determines whether a URL is targeting localhost.
 * Localhost hosts are exempt from HTTPS enforcement (Requirement 27.3).
 */
function isLocalhostUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname
    return hostname === 'localhost' || hostname === '127.0.0.1'
  } catch {
    // Relative URLs (e.g. "/api/v1/...") are served from the same origin
    // and inherit the page's protocol — no enforcement needed.
    return true
  }
}

// ── Request Interceptor ──

apiClient.interceptors.request.use((config) => {
  // Attach JWT token
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // HTTPS enforcement: block plain HTTP requests to non-localhost in production (Req 27.3)
  if (import.meta.env.PROD) {
    const baseURL = config.baseURL || ''
    const requestUrl = config.url || ''
    // Resolve the full URL to check protocol
    let fullUrl: string
    try {
      fullUrl = requestUrl.startsWith('http')
        ? requestUrl
        : baseURL.startsWith('http')
          ? new URL(requestUrl, baseURL).toString()
          : ''
    } catch {
      fullUrl = ''
    }

    if (fullUrl.startsWith('http://') && !isLocalhostUrl(fullUrl)) {
      return Promise.reject(
        new Error(
          `[Security] Blocked insecure HTTP request to non-localhost URL. All API requests must use HTTPS in production.`
        )
      )
    }
  }

  // Duplicate submission prevention (Req 26.6)
  const dedupKey = getDeduplicationKey(
    config.method || 'GET',
    config.url || '',
    config.data
  )

  if (dedupKey) {
    if (isRequestInflight(dedupKey)) {
      // Reject duplicate submission
      const controller = new AbortController()
      controller.abort()
      config.signal = controller.signal
      return config
    }
    // Mark this request as in-flight
    const controller = markRequestInflight(dedupKey)
    config.signal = config.signal || controller.signal
    // Store the key on the config for cleanup in response interceptor
    ;(config as InternalAxiosRequestConfig & { _dedupKey?: string })._dedupKey = dedupKey
  }

  return config
})

// ── Response Interceptor ──

apiClient.interceptors.response.use(
  (response) => {
    // Clear deduplication tracking on success
    const dedupKey = (response.config as InternalAxiosRequestConfig & { _dedupKey?: string })._dedupKey
    if (dedupKey) {
      clearInflightRequest(dedupKey)
    }
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
      _retryAuth?: boolean
      _dedupKey?: string
    }

    // Clear deduplication tracking on failure
    if (originalRequest?._dedupKey) {
      clearInflightRequest(originalRequest._dedupKey)
    }

    const status = error.response?.status

    // ── 401 Handling (Req 26.2, 27.5) ──
    // Attempt token refresh once, then force sign-out + redirect
    if (status === 401 && originalRequest && !originalRequest._retryAuth) {
      // Don't retry the refresh endpoint itself
      if (originalRequest.url?.includes(TOKEN_REFRESH_ENDPOINT)) {
        forceSignOut()
        return Promise.reject(error)
      }

      originalRequest._retryAuth = true

      if (!isRefreshing) {
        isRefreshing = true

        const newToken = await attemptTokenRefresh()

        isRefreshing = false

        if (newToken) {
          onTokenRefreshed(newToken)
          // Retry the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return apiClient(originalRequest)
        } else {
          // Refresh failed — force sign-out
          onTokenRefreshed(null)
          forceSignOut()
          return Promise.reject(error)
        }
      } else {
        // Another refresh is in progress — queue this request
        return new Promise((resolve, reject) => {
          subscribeToTokenRefresh((token) => {
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`
              resolve(apiClient(originalRequest))
            } else {
              reject(error)
            }
          })
        })
      }
    }

    // ── 5xx Auto-Retry (Req 26.4) ──
    // Automatically retry once after 2s delay for server errors
    if (status && status >= 500 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true
      await delay(RETRY_DELAY_MS)
      return apiClient(originalRequest)
    }

    return Promise.reject(error)
  }
)

export default apiClient
