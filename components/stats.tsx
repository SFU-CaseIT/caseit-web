"use client";

import { useEffect, useState } from "react";

type StatItem = {
  number: number;
  label: string;
  isActive: boolean;
  className?:string;
};

export default function StatCard({
  number,
  label,
  isActive,
  className,
}: StatItem) {
  const [count, setCount] = useState(0);
  const duration = 1200;

  useEffect(() => {
    if (!isActive) return;

    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    if (motionPreference.matches) {
      const frameId = requestAnimationFrame(() => setCount(number));
      return () => cancelAnimationFrame(frameId);
    }

    let frameId = 0;
    const startTime = performance.now();

    const updateCount = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const easedProgress = 1 - (1 - progress) ** 3;
      setCount(Math.floor(number * easedProgress));

      if (progress < 1) {
        frameId = requestAnimationFrame(updateCount);
      }
    };
    frameId = requestAnimationFrame(updateCount);
    return () => cancelAnimationFrame(frameId);
  }, [duration, isActive, number]);
  return (
    <div
      className={`text-[4.5rem] xl:text-[152px] font-din text-redDark flex flex-col items-center leading-none ${className}`}
    >
      {String(count).padStart(2, "0")}
      <span className="text-paragraph xl:text-[1.5rem] font-sans">{label}</span>
    </div>
  );
}
