"use client";

import { useInView } from "react-intersection-observer";
import StatCard from "@/components/stats";

type StatsGridProps = {
  stats: { label: string; count: number }[];
};

export default function StatsGrid({ stats }: StatsGridProps) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.5 });

  return (
    <div
      ref={ref}
      className="grid grid-cols-2 mb-20 mt-12 md:mt-4 md:grid-cols-5 place-items-center p-8 gap-8 max-w-96 md:max-w-[1440px] mx-auto"
    >
      {stats.map((stat, index) => (
        <StatCard
          key={stat.label}
          number={stat.count}
          label={stat.label}
          isActive={inView}
          className={index === stats.length - 1 ? "col-span-2 md:col-span-1" : ""}
        />
      ))}
    </div>
  );
}
