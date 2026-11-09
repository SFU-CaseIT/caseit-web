"use client";

import { useInView } from "framer-motion";
import { Fragment, useContext, useRef } from "react";
import { ScrollGradientSceneContext } from "@/components/layout/ScrollGradient";

export default function WordFadeIn({ text, inView = false }: { text: string; inView?: boolean }) {
  const sceneActive = useContext(ScrollGradientSceneContext);
  const ref = useRef<HTMLSpanElement>(null);
  const visible = useInView(ref, { once: true, amount: "all" });
  const active = inView ? visible : sceneActive;
  const words = text.split(" ");

  return (
    <>
      <span className="sr-only">{text}</span>
      <span ref={inView ? ref : undefined} aria-hidden="true">
        {words.map((word, index) => (
          <Fragment key={index}>
            <span className="inline-block overflow-hidden align-bottom">
              <span
                className={`inline-block motion-safe:transition-[translate] motion-safe:duration-700 motion-safe:ease-out ${active ? "translate-y-0" : "motion-safe:translate-y-full"}`}
                style={{ transitionDelay: active ? `${index * 70}ms` : "0ms" }}
              >
                {word}
              </span>
            </span>
            {index < words.length - 1 ? " " : null}
          </Fragment>
        ))}
      </span>
    </>
  );
}
