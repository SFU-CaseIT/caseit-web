import type { Metadata } from "next";
import ScrollGradient from "@/components/layout/ScrollGradient";
import StatisticsReveal from "@/components/animations/StatisticsReveal";
import Typerwriter from "@/components/animations/Typerwriter";
import FadeIn from "@/components/animations/FadeIn";
import WordFadeIn from "@/components/animations/WordFadeIn";

const words = ["Unparalleled", "Rigorous", "Engaged"] as const;

export const metadata: Metadata = {
  title: "Home",
  description:
    "Discover CaseIT, an international management information systems case competition bringing university teams to Vancouver.",
};

export default function Home() {
  const stats = [
    { label: "competitors", count: 64 },
    { label: "teams", count: 16 },
    { label: "days", count: 6 },
    { label: "cases", count: 2 },
  ];

  return (
    <main>
      <ScrollGradient
        className="-mt-20 md:-mt-24"
        hero={
          <div className="site-container max-w-5xl">
            <Typerwriter words={words} />
            <FadeIn>
              <p className="mx-auto mt-6 max-w-[50ch] text-center font-dinText text-[1.5rem] font-normal leading-none tracking-[0em] md:mt-8">
                The World’s Premier International Management Information System
                Case Competition.
              </p>
            </FadeIn>
          </div>
        }
        transition={
          <p className="mx-auto max-w-[50ch] font-dinText text-[1.5rem] font-normal leading-[1.3] tracking-[0em]">
            <WordFadeIn text="Every year, 16 university teams come to Vancouver to solve real corporate challenges at CaseIT." />
          </p>
        }
        content={
          <section
            aria-label="CaseIT at a glance"
            className="mt-30 w-full pb-12 text-black md:pb-24"
            style={{ minHeight: "calc(100svh + 10rem)" }}
          >
            <div className="site-container flex min-h-[calc(50svh+7rem)] max-w-[90rem] flex-col items-center justify-end pt-12 md:min-h-[calc(50svh+2rem)] md:pt-24">
              <FadeIn inView>
                <p className="max-w-[50ch] text-center font-dinText text-[1.5rem] font-normal leading-none tracking-[0em] text-black">
                  We foster industry expertise, cultural diversity and
                  international communities through
                </p>
              </FadeIn>
              <StatisticsReveal stats={stats} />
            </div>
            <p
              className="site-container mt-64 text-center font-din font-medium leading-[1.3] md:mt-72"
              style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)" }}
            >
              <WordFadeIn inView text="CaseIT 2027 will take place February 14 to 19, 2027." />
            </p>
          </section>
        }
      />
    </main>
  );
}
