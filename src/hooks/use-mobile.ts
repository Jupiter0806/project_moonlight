import * as React from "react";

const MOBILE_BREAKPOINT = 768;

// this is actually small screen check not mobile
// it should only be used for responsive layout decisions, not for feature gating based on input capabilities (e.g. hover, scrollbar styling)
// check useIsDesktopPointer in use-auto-hide-scrollbar for input-capability-based decisions

// another issue
// the initial value of isMobile is set to undefined, and then updated on the client side after the first render. This means that during the first render, components using this hook will see isMobile as false (since !!undefined is false), which may cause a mismatch between server and client rendering. To avoid this, we can set the initial state to a boolean value based on the current window width, but this would cause an error during server-side rendering since window is not defined. One way to handle this is to check if window is defined before accessing it, and default to a specific value (e.g., false) during server-side rendering. Here's how you can implement this:
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
