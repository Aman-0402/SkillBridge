import { useEffect, useRef, useCallback } from 'react'

const IDLE_MS   = 30 * 60 * 1000  // 30 min total idle
const WARN_MS   = 60 * 1000       // show warning 60s before logout

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click']

/**
 * Calls onWarn(secondsLeft) when idle approaches limit,
 * calls onLogout() when time is up.
 * Returns resetTimer fn so UI "Stay logged in" btn can cancel.
 */
export function useInactivityLogout({ onWarn, onDismiss, onLogout, enabled = true }) {
  const warnTimer   = useRef(null)
  const logoutTimer = useRef(null)
  const warnActive  = useRef(false)

  const clearAll = useCallback(() => {
    clearTimeout(warnTimer.current)
    clearTimeout(logoutTimer.current)
  }, [])

  const resetTimer = useCallback(() => {
    clearAll()
    warnActive.current = false
    onDismiss?.()

    warnTimer.current = setTimeout(() => {
      warnActive.current = true
      onWarn(Math.round(WARN_MS / 1000))

      logoutTimer.current = setTimeout(() => {
        onLogout()
      }, WARN_MS)
    }, IDLE_MS - WARN_MS)
  }, [clearAll, onWarn, onDismiss, onLogout])

  useEffect(() => {
    if (!enabled) return

    resetTimer()
    ACTIVITY_EVENTS.forEach(evt =>
      document.addEventListener(evt, resetTimer, { passive: true })
    )

    return () => {
      clearAll()
      ACTIVITY_EVENTS.forEach(evt =>
        document.removeEventListener(evt, resetTimer)
      )
    }
  }, [enabled, resetTimer, clearAll])

  return { resetTimer }
}
