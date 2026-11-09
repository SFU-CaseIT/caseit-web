"use client";

import {
  createContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export const ScrollGradientSceneContext = createContext(true);

type ScrollGradientProps = {
  hero: ReactNode;
  transition: ReactNode;
  content: ReactNode;
  className?: string;
};

export default function ScrollGradient({
  hero,
  transition,
  content,
  className = "",
}: ScrollGradientProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [messageActive, setMessageActive] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    const background = backgroundRef.current;
    const headline = heroRef.current;
    if (!section || !background || !headline) return;

    gsap.registerPlugin(ScrollTrigger);

    let messageSceneActive = false;
    const context = gsap.context(() => {
      gsap.set(headline, { autoAlpha: 1, y: 0 });
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          onUpdate: (self) => {
            const isMessageActive = self.progress >= 0.35;
            if (isMessageActive !== messageSceneActive) {
              messageSceneActive = isMessageActive;
              setMessageActive(isMessageActive);
            }
          },
        },
      });

      timeline
        .to(
          background,
          { backgroundPositionY: "100%", duration: 1, ease: "none" },
          0,
        )
        .to(
          headline,
          { autoAlpha: 0, y: -16, duration: 0.1, ease: "none" },
          0.25,
        );
    }, section);

    return () => {
      context.revert();
    };
  }, []);

  return (
      <div className={`relative isolate ${className}`}>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-clip"
          style={{
            maskImage: "linear-gradient(to bottom, black calc(100% - 50svh), transparent 100%)",
          }}
        >
          <div
            ref={sectionRef}
            data-landing-gradient
            className="absolute inset-x-0 top-0 h-[400vh]"
          >
            <div
              ref={backgroundRef}
              className="sticky top-0 h-svh bg-[length:100%_300%] bg-[position:50%_0%]"
              style={{ backgroundImage: "var(--caseit-gradient)" }}
            />
          </div>
        </div>

        {/* The hero occupies the first 105vh; the transition releases at its end. */}
        <div className="relative h-[105vh]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[155vh]">
            <div className="sticky top-[50svh] -translate-y-1/2 text-center text-white">
              <div ref={heroRef} className="pointer-events-auto w-full px-6">
                {hero}
              </div>
            </div>
          </div>
        </div>
        <div className="pointer-events-none relative h-[130vh]">
          {/* Increase the bottom offset to release the sentence earlier. */}
          <div className="absolute inset-x-0 top-0 bottom-0">
            <div className="sticky top-[50svh] h-0">
              <div
                className={`pointer-events-auto -translate-y-1/2 px-6 text-center text-white ${messageActive ? "visible" : "invisible"}`}
              >
                <ScrollGradientSceneContext.Provider value={messageActive}>
                  {transition}
                </ScrollGradientSceneContext.Provider>
              </div>
            </div>
          </div>
        </div>
        <div className="relative">
          {content}
        </div>
      </div>
  );
}
