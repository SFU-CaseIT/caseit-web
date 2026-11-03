"use client";

import {
  Children,
  createContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export const ScrollGradientContext = createContext(false);

type ScrollGradientProps = {
  children: ReactNode;
  className?: string;
};

export default function ScrollGradient({
  children,
  className = "",
}: ScrollGradientProps) {
  const scenes = Children.toArray(children);
  const sectionRef = useRef<HTMLElement>(null);
  const backgroundRef = useRef<HTMLDivElement>(null);
  const sceneRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [finalActive, setFinalActive] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    const background = backgroundRef.current;
    const [headline, message, finalScene] = sceneRefs.current;
    if (!section || !background || !headline || !message || !finalScene) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reducedMotion) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    let finalSceneActive = false;
    const context = gsap.context(() => {
      gsap.set(headline, { autoAlpha: 1, y: 0 });
      gsap.set([message, finalScene], { autoAlpha: 0 });

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          onUpdate: (self) => {
            const isActive = self.progress >= 0.8;
            if (isActive === finalSceneActive) return;
            finalSceneActive = isActive;
            setFinalActive(isActive);
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
        )
        .to(message, { autoAlpha: 1, duration: 0.1, ease: "none" }, 0.35)
        .to(message, { autoAlpha: 0, duration: 0.15, ease: "none" }, 0.65)
        .to(finalScene, { autoAlpha: 1, duration: 0.1, ease: "none" }, 0.8);
    }, section);

    return () => context.revert();
  }, [scenes.length]);

  return (
    <ScrollGradientContext.Provider value={finalActive}>
      <section
        ref={sectionRef}
        className={`scroll-gradient-section relative h-[400vh] ${className}`}
      >
        <div
          ref={backgroundRef}
          className="scroll-gradient-background sticky top-0 grid h-svh place-items-center overflow-hidden bg-[length:100%_300%] bg-[position:50%_0%] text-center text-white"
          style={{
            backgroundImage:
              "linear-gradient(180deg, #000000 0%, #BE3B35 37.5%, #D8C7C7 77.5%, #D8C7C700 100%)",
          }}
        >
          <div className="scroll-gradient-scenes">
            {scenes.map((scene, index) => (
              <div
                className="scroll-gradient-scene relative z-10"
                key={index}
                ref={(element) => {
                  sceneRefs.current[index] = element;
                }}
                style={{
                  opacity: index === 0 ? 1 : 0,
                  visibility: index === 0 ? "visible" : "hidden",
                }}
              >
                {scene}
              </div>
            ))}
          </div>
        </div>
      </section>
    </ScrollGradientContext.Provider>
  );
}
