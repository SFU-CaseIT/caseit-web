"use client";

import { useEffect, useRef, useState } from "react";
import Countdown from "@/components/Countdown";

const revealDuration = 700;

type Statistic = {
  label: string;
  count: number;
};

function Connector({ active, edge = false, end = false }: {
  active: boolean;
  edge?: boolean;
  end?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={`${edge ? "hidden min-w-20 flex-1 xl:flex" : "hidden md:flex"} items-center ${edge && !end ? "justify-end" : ""}`}
    >
      <span
        className={`flex items-center ${edge ? "w-full max-w-[16.5625rem]" : ""} ${active ? "[clip-path:inset(0)]" : "motion-safe:[clip-path:inset(0_100%_0_0)]"} motion-safe:transition-[clip-path] motion-safe:ease-out`}
        style={{
          transitionDuration: `${revealDuration}ms`,
        }}
      >
        <span className={`h-px bg-black ${edge ? "w-full" : "w-[5rem]"}`} />
        <span className={`${end ? "invisible" : ""} h-[1.0625rem] w-[1.0625rem] shrink-0 rounded-full bg-black`} />
      </span>
    </span>
  );
}

export default function StatisticsReveal({ stats }: { stats: Statistic[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [counting, setCounting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 1) {
          setActive(true);
          const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          const connectorsVisible = window.matchMedia("(min-width: 48rem)").matches;
          timer = setTimeout(
            () => setCounting(true),
            reducedMotion || !connectorsVisible ? 0 : revealDuration,
          );
          observer.disconnect();
        }
      },
      { threshold: 1 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  return (
    <div ref={ref} className="mt-16 grid w-full grid-cols-2 items-center justify-items-center gap-x-4 gap-y-10 md:flex md:flex-row md:justify-center md:gap-4">
      <Connector active={active} edge />
      {stats.map((stat, index) => (
        <div className="flex items-center gap-4 md:gap-4" key={stat.label}>
          <Countdown number={stat.count} label={stat.label} active={counting} />
          {index < stats.length - 1 && <Connector active={active} />}
        </div>
      ))}
      <Connector active={active} edge end />
    </div>
  );
}
