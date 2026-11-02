"use client";

import { useEffect, useState } from "react";

/** H1 话术轮换:首帧为第一条(SSR/SEO 友好),周期性上滑换词。 */
export function RotatingText({
  phrases,
  interval = 3800,
}: {
  phrases: string[];
  interval?: number;
}) {
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (phrases.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => {
      setLeaving(true);
      setTimeout(() => {
        setIndex((v) => (v + 1) % phrases.length);
        setLeaving(false);
      }, 420);
    }, interval);
    return () => clearInterval(timer);
  }, [phrases.length, interval]);

  return (
    <span
      className={`rotating ${leaving ? "rotating-out" : "rotating-in"}`}
      aria-live="off"
    >
      {phrases[index]}
    </span>
  );
}
