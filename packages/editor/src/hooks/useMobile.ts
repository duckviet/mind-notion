"use client"

import * as React from "react"

const MOBILE_BREAKPOINT = 768

/**
 * Hook to detect if the viewport width is below the mobile breakpoint (768px).
 * Listens to window resize events and updates the state accordingly.
 *
 * @example
 * function MyComponent() {
 *   const isMobile = useIsMobile()
 *   return <div>{isMobile ? "Mobile" : "Desktop"}</div>
 * }
 *
 * @returns Boolean indicating if current viewport is mobile-sized
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
