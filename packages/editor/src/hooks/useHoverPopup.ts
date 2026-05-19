import { useState, useCallback, useRef, useEffect } from "react";

export interface HoverPopupState<T> {
  data: T;
  x: number;
  y: number;
}

export interface UseHoverPopupOptions<T> {
  /** CSS selector to match hoverable elements */
  selector: string;
  /** Extract data from the hovered element. Return null to skip. */
  extract: (el: HTMLElement) => T | null;
  /** Position relative to element. Default: bottom-center */
  getPosition?: (rect: DOMRect) => { x: number; y: number };
  /** Delay before hiding (ms). Default: 150 */
  hideDelay?: number;
}

const defaultPosition = (rect: DOMRect) => ({
  x: rect.left + rect.width / 2,
  y: rect.bottom + 6,
});

export function useHoverPopup<T>(
  container: HTMLElement | null,
  {
    selector,
    extract,
    getPosition = defaultPosition,
    hideDelay = 150,
  }: UseHoverPopupOptions<T>,
) {
  const [popup, setPopup] = useState<HoverPopupState<T> | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isOverPopup = useRef(false);
  const isOverTarget = useRef(false);
  const activeElement = useRef<HTMLElement | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const hide = useCallback(() => {
    setPopup(null);
    activeElement.current = null;
  }, []);

  const scheduleHide = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      if (!isOverPopup.current && !isOverTarget.current) {
        hide();
      }
    }, hideDelay);
  }, [clearTimer, hide, hideDelay]);

  const show = useCallback(
    (el: HTMLElement) => {
      const data = extract(el);
      if (data === null) return;

      const rect = el.getBoundingClientRect();
      const pos = getPosition(rect);
      setPopup({ data, ...pos });
      activeElement.current = el;
    },
    [extract, getPosition],
  );

  // --- DOM event listeners ---
  useEffect(() => {
    if (!container) return;

    const handleMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest(
        selector,
      ) as HTMLElement | null;
      if (!target || !container.contains(target)) return;

      isOverTarget.current = true;
      clearTimer();
      show(target);
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest(
        selector,
      ) as HTMLElement | null;
      if (!target || !container.contains(target)) return;

      const related = e.relatedTarget as Node | null;
      if (related && target.contains(related)) return;

      isOverTarget.current = false;
      scheduleHide();
    };

    container.addEventListener("mouseover", handleMouseOver);
    container.addEventListener("mouseout", handleMouseOut);

    return () => {
      container.removeEventListener("mouseover", handleMouseOver);
      container.removeEventListener("mouseout", handleMouseOut);
      clearTimer();
    };
  }, [container, selector, show, scheduleHide, clearTimer]);

  // --- Popup mouse handlers (attach to popup element) ---
  const popupHandlers = {
    onMouseEnter: useCallback(() => {
      isOverPopup.current = true;
      clearTimer();
    }, [clearTimer]),
    onMouseLeave: useCallback(() => {
      isOverPopup.current = false;
      scheduleHide();
    }, [scheduleHide]),
  };

  return {
    popup,
    popupRef,
    popupHandlers,
    activeElement: activeElement as React.RefObject<HTMLElement | null>,
    hide,
  };
}
