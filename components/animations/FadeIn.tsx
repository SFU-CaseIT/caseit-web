"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type FadeInProps = {
  children: ReactNode;
  className?: string;
  inView?: boolean;
};

export default function FadeIn({ children, className = "", inView = false }: FadeInProps) {
  const target = { opacity: 1, y: 0 };

  return (
    <motion.div
      animate={inView ? undefined : target}
      className={`fade-in-motion ${inView ? "motion-reduce:!opacity-100 motion-reduce:!transform-none" : ""} ${className}`.trim()}
      initial={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.8,
        ease: [0.16, 1, 0.4, 1],
      }}
      viewport={inView ? { once: true, amount: "all" } : undefined}
      whileInView={inView ? target : undefined}
    >
      {children}
    </motion.div>
  );
}
