"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type FadeInProps = {
  children: ReactNode;
  className?: string;
};

export default function FadeIn({ children, className = "" }: FadeInProps) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={`fade-in-motion ${className}`.trim()}
      initial={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.8,
        ease: [0.16, 1, 0.4, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
