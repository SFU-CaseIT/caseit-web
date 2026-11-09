"use client";

import { useEffect, useState } from "react";

type CountdownProps = {
  number: number;
  label: string;
  active: boolean;
};

export default function Countdown({ number, label, active }: CountdownProps) {
  const [count, setCount] = useState(0);
  const duration = 1200;

  useEffect(() => {
    if (!active) return;

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
  }, [duration, active, number]);
  return (
    <div className="flex min-w-0 flex-col items-center text-center text-black">
      <span className="font-din text-[clamp(4rem,8vw,6rem)] font-medium leading-none tracking-[0em]">
        <span className="sr-only">{String(number).padStart(2, "0")}</span>
        <span aria-hidden="true" className="motion-reduce:hidden">{String(count).padStart(2, "0")}</span>
        <span aria-hidden="true" className="hidden motion-reduce:inline">{String(number).padStart(2, "0")}</span>
      </span>
      <span className="mt-4 font-dinText text-[1rem] font-normal leading-none tracking-[0em]">
        {label}
      </span>
    </div>
  );
}
