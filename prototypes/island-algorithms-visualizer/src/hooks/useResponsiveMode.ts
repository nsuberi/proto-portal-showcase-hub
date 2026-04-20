import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768;

export function useResponsiveMode(): { isMobile: boolean; width: number } {
  const [width, setWidth] = useState(() =>
    typeof window === "undefined" ? 1024 : window.innerWidth,
  );

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return { width, isMobile: width < MOBILE_BREAKPOINT };
}
