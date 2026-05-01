import { useCallback, useEffect, useRef, useState } from "react";

interface UseAutoHideScrollbarOptions {
  idleDelayMs?: number;
}

export function useAutoHideScrollbar(
  options: UseAutoHideScrollbarOptions = {},
) {
  const { idleDelayMs = 520 } = options;
  const [isDesktopPointer, setIsDesktopPointer] = useState(false);
  const timersRef = useRef(
    new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>(),
  );
  const allTimersRef = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    // Scrollbar styling is an input-capability decision, not a layout decision.
    // We intentionally do not use useIsMobile() (max-width based) because a
    // narrow desktop window still has a precise pointer, while a large tablet
    // can still be touch-first. `(pointer: fine)` tracks that intent directly.
    const mediaQuery = window.matchMedia("(pointer: fine)");
    const syncPointerMode = () => {
      setIsDesktopPointer(mediaQuery.matches);
    };

    syncPointerMode();
    mediaQuery.addEventListener("change", syncPointerMode);

    return () => {
      mediaQuery.removeEventListener("change", syncPointerMode);
    };
  }, []);

  useEffect(() => {
    return () => {
      allTimersRef.current.forEach((timer) => clearTimeout(timer));
      allTimersRef.current.clear();
    };
  }, []);

  const markScrolling = useCallback(
    (target: EventTarget | null) => {
      if (!isDesktopPointer) return;
      if (!(target instanceof HTMLElement)) return;

      target.dataset.scrolling = "true";

      const existingTimer = timersRef.current.get(target);
      if (existingTimer) {
        clearTimeout(existingTimer);
        allTimersRef.current.delete(existingTimer);
      }

      const timer = setTimeout(() => {
        delete target.dataset.scrolling;
        timersRef.current.delete(target);
        allTimersRef.current.delete(timer);
      }, idleDelayMs);

      timersRef.current.set(target, timer);
      allTimersRef.current.add(timer);
    },
    [idleDelayMs, isDesktopPointer],
  );

  return {
    scrollbarClassName: isDesktopPointer ? "auto-hide-scrollbar" : "",
    markScrolling,
  };
}
