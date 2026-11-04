import type { Metadata } from "next";
import ScrollGradient from "@/components/layout/ScrollGradient";
import Countdown from "@/components/Countdown";
import Typerwriter from "@/components/animations/Typerwriter";

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
      >
        <div className="site-container max-w-5xl">
          <Typerwriter words={words} />
          <p className="mx-auto mt-6 max-w-[50ch] text-center font-dinText text-[1.5rem] font-normal leading-none tracking-[0em] md:mt-8">
            The World’s Premier International Management Information System
            Case Competition.
          </p>
        </div>
        <p className="mx-auto max-w-[50ch] font-dinText text-[1.5rem] font-normal leading-none tracking-[0em]">
          Every year, 16 university teams come to Vancouver to solve real
          corporate challenges at CaseIT.
        </p>
        <section
          aria-label="CaseIT at a glance"
          className="scroll-gradient-final flex min-h-svh w-full items-center justify-center py-12 text-black md:py-24"
        >
          <div className="site-container flex max-w-[90rem] flex-col items-center">
            <p className="max-w-[50ch] text-center font-dinText text-[1.5rem] font-normal leading-none tracking-[0em] text-black">
              We foster industry expertise, cultural diversity and
              international communities through
            </p>
            <div className="mt-16 grid w-full grid-cols-2 items-center justify-items-center gap-x-4 gap-y-10 md:flex md:flex-row md:justify-center md:gap-4">
              <div
                aria-hidden="true"
                className="hidden min-w-20 flex-1 items-center justify-end xl:flex"
              >
                <span className="h-px w-full max-w-[15.5rem] bg-[#D8C7C7]" />
                <span className="h-[1.0625rem] w-[1.0625rem] shrink-0 rounded-full bg-[#D8C7C7]" />
              </div>
              {stats.map((stat, index) => (
                <div
                  className="flex items-center gap-4 md:gap-4"
                  key={stat.label}
                >
                  <Countdown number={stat.count} label={stat.label} />
                  {index < stats.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="hidden items-center md:flex"
                    >
                      <span className="h-px w-[5rem] bg-[#D8C7C7]" />
                      <span className="h-[1.0625rem] w-[1.0625rem] shrink-0 rounded-full bg-[#D8C7C7]" />
                    </span>
                  )}
                </div>
              ))}
              <span
                aria-hidden="true"
                className="hidden min-w-20 flex-1 items-center xl:flex"
              >
                <span className="h-px w-full max-w-[15.5rem] bg-[#D8C7C7]" />
                <span className="invisible h-[1.0625rem] w-[1.0625rem] shrink-0 rounded-full bg-[#D8C7C7]" />
              </span>
            </div>
          </div>
        </section>
      </ScrollGradient>
    </main>
  );
}
