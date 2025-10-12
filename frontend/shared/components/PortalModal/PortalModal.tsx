import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

const Portal: React.FC<{
  children: React.ReactNode;
  container?: Element | null;
}> = ({ children, container }) => {
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

  if (!mounted || typeof document === "undefined") return null;

  const targetContainer = getContainer();
  if (!targetContainer) return null;

  return createPortal(children, targetContainer);
};

export default Portal;
