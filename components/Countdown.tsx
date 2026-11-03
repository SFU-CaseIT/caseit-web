"use client";

import { useContext, useEffect, useState } from "react";
import { ScrollGradientContext } from "@/components/layout/ScrollGradient";

type CountdownProps = {
  number: number;
  label: string;
};

export default function Countdown({ number, label }: CountdownProps) {
  const [count, setCount] = useState(0);
  const isActive = useContext(ScrollGradientContext);
  const duration = 1200;

  useEffect(() => {
    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    if (motionPreference.matches) {
      const frameId = requestAnimationFrame(() => setCount(number));
      return () => cancelAnimationFrame(frameId);
    }

    if (!isActive) return;

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
    <div className="flex min-w-0 flex-col items-center text-center text-black">
      <span className="font-din text-[clamp(4rem,8vw,6rem)] font-medium leading-none tracking-[0em]">
        {String(count).padStart(2, "0")}
      </span>
      <span className="mt-4 font-dinText text-[1rem] font-normal leading-none tracking-[0em]">
        {label}
      </span>
    </div>
  );
}
