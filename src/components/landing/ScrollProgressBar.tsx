import { motion, useScroll, useSpring } from "framer-motion";

/**
 * Thin reading-progress line — gradient from `index.css` (`--scroll-progress-gradient`):
 * light mode: primary → accent → success; dark mode: tuned for contrast on dark UI.
 */
export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      className="scroll-progress-themed pointer-events-none fixed left-0 right-0 top-0 z-[60] h-[3px] origin-left"
      style={{ scaleX }}
      aria-hidden
    />
  );
}
