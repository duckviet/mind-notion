import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

const Portal: React.FC<{
  children: React.ReactNode;
  container?: Element | null;
  lockScroll?: boolean;
}> = ({ children, container, lockScroll = true }) => {
  const [mounted, setMounted] = useState(false);

  const getContainer = useCallback(() => {
    return (
      container || (typeof document !== "undefined" ? document.body : null)
    );
  }, [container]);

  useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
    };
  }, []);

  // Lock body scroll while the portal is mounted (e.g., modal open)
  useEffect(() => {
    if (!mounted || !lockScroll || typeof document === "undefined") return;

    const { body, documentElement } = document;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;

    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [mounted, lockScroll]);

  if (!mounted || typeof document === "undefined") return null;

  const targetContainer = getContainer();
  if (!targetContainer) return null;

  return createPortal(children, targetContainer);
};

export default Portal;
