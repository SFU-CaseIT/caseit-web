"use client";

import { useEffect, useState } from "react";

type TyperwriterProps = {
  className?: string;
  words: readonly [string, ...string[]];
};

export default function Typerwriter({
  className = "",
  words,
}: TyperwriterProps) {
  const [text, setText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;
    const wait = (duration: number) =>
      new Promise<void>((resolve) => {
        timeoutId = setTimeout(resolve, duration);
      });

    const animate = async () => {
      let wordIndex = 0;

      while (!cancelled) {
        const word = words[wordIndex];

        setCursorVisible(true);
        for (let index = 1; index <= word.length; index += 1) {
          setText(word.slice(0, index));
          await wait(65 + Math.random() * 35);
          if (cancelled) return;
        }

        await wait(600);
        if (cancelled) return;

        for (let blink = 0; blink < 4; blink += 1) {
          setCursorVisible(blink % 2 === 1);
          await wait(530);
          if (cancelled) return;
        }

        setCursorVisible(true);
        await wait(200);
        if (cancelled) return;

        for (let index = word.length - 1; index >= 0; index -= 1) {
          setText(word.slice(0, index));
          await wait(35 + Math.random() * 25);
          if (cancelled) return;
        }

        wordIndex = (wordIndex + 1) % words.length;
        await wait(180);
      }
    };

    void animate();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [words]);

  return (
    <h1
      aria-label={words.join(", ")}
      className={`flex items-center justify-center text-[clamp(3rem,6.25vw,6rem)] font-medium leading-none tracking-[0em] ${className}`}
    >
      <span aria-hidden="true" className="typewriter-animated">
        {text}
        <span
          className="typewriter-cursor h-[1.15em] w-[0.052em] shrink-0 bg-current"
          style={{ opacity: cursorVisible ? 1 : 0 }}
        />
      </span>
    </h1>
  );
}
