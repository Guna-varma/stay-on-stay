import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * Ensures production-friendly scroll behavior:
 * - new page route -> top of page
 * - hash route (/#section) -> target section
 */
export default function ScrollManager() {
  const location = useLocation();
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    const pathnameChanged = prevPath.current !== location.pathname;
    prevPath.current = location.pathname;

    if (location.hash) {
      const id = location.hash.replace(/^#/, "");
      if (!id) return;
      const t = window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
      return () => window.clearTimeout(t);
    }

    if (pathnameChanged) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [location.pathname, location.hash]);

  return null;
}

