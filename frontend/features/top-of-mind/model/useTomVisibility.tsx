import { useEffect, useRef, useState } from "react";

export function useTomVisibility(deps: unknown[]) {
  const tomRef = useRef<HTMLDivElement>(null);
  const [isTomVisible, setIsTomVisible] = useState(true);

  useEffect(() => {
    const element = tomRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsTomVisible(entry.isIntersecting),
      { threshold: 0.1 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, deps);

  return { tomRef, isTomVisible };
}
