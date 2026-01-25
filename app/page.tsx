"use client";
import { useInView } from "react-intersection-observer";
import * as home from "@/content/home_content";
import { SquareButton } from "@/components/buttons";
import { TextDot } from "@/components/text";
import { Icon2025 } from "@/public/svgs/2026";
import HeroSection from "@/components/HeroSection";
import { useCountUp } from "@/hooks/useCountUp";
import Image from "next/image";
import StatCard from "@/components/stats";
import { BoldedText } from "@/components/text";
import Banner2026 from "@/public/imgs/2026.png"
import TawkTo from "@/components/liveChat";

export default function Home() {
  const { ref: sectionRef, inView } = useInView({
    triggerOnce: true, // Trigger only once when it enters the viewport
    threshold: 0.5, // Trigger when 10% of the section is visible
  });
  const competitors = useCountUp(64, 1500, inView);
  const teams = useCountUp(16, 1000, inView);
  const days = useCountUp(6, 500, inView);
  const cases = useCountUp(2, 200, inView);
  const competition = useCountUp(1, 100, inView);

  const stats = [
    { label: "Competitors", count: competitors },
    { label: "Teams", count: teams },
    { label: "Days", count: days },
    { label: "Cases", count: cases },
    { label: "Competition", count: competition },
  ];

  console.log(inView);

  return (
    <main>
      {/* ---MAIN BANNER--- */}
      <div className=" relative overflow-hidden h-screen md:mb-[20vh]">
        {/* BG moving imgs */}
        <HeroSection />
        {/* Title text with red dots  */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2">
          <div className="w-full h-screen items-center justify-center flex ">
            <div>
              {home.TitleList.map((item, index) => (
                <TextDot
                  key={index}
                  dotText={
                    <div className="text-header1 justify-center">
                      {item.title}{" "}
                    </div>
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* ---Stat scroll and globe section--- */}
      <section className="relative overflow-hidden md:py-[25vh]">
        {/* bg img  */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center">
          <Image
            src="/svgs/globe.svg"
            alt="Background Globe"
            fill={true}
            className="w-[150vw] object-cover h-auto hidden md:block"
          />
        </div>
        {/* number scrolling */}
        <div
          ref={sectionRef}
          className="grid grid-cols-2 mb-20 mt-12 md:mt-4 md:grid-cols-5 place-items-center p-8 gap-8 max-w-96 md:max-w-[1440px] mx-auto"
        >
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              number={stat.count}
              label={stat.label}
              className={
                index === stats.length - 1 ? "col-span-2 md:col-span-1" : ""
              }
            />
          ))}
        </div>
        {/*When you are here, to add back the icon, modified the padding */}
        {/* Vancouver card  */}
        <div className="  mt-12 flex flex-col  border-redDark border-2 rounded-2xl gap-12 p-4 md:p-6 xl:p-10 w-[90%] max-w-[25rem] md:max-w-[1200px] mx-auto drop-shadow-[0_0_15px_rgba(197,52,52,0.25)] bg-white text-center">
          {/* <div className="w-full">
            <Image src={Banner2026} alt="2026" className="w-[100%] h-[100%]"/>
          </div> */}

          <div className=" text-[1rem] lg:text-[1rem] flex flex-col justify-center">
              <h2 className="font-bold text-redDark md:text-[1.5rem]">
                {home.HomeText.header2[0]}
              </h2>
              <h3 className="font-bold text-[1.125rem] md:text-[1.75rem] lg:text-[2.5rem]">
                {home.HomeText.large[0]}
              </h3>
                <BoldedText text={home.HomeText.paragraph[0]} />
                <BoldedText text={home.HomeText.paragraph[1]} />
              {/* <div className="mt-4 max-w-[40ch] lg:max-w-[45ch] text-center">
              </div>
              <div className="mt-4 max-w-[60ch] lg:max-w-[45ch] text-center">
            </div> */}
          </div>
        </div>
      </section>
      {/* ---What is CaseIT--- */}
      <section className=" relative flex flex-col bg-sectionBlack w-full text-left md:text-center md:items-center justify-center font-light gap-8 text-white mt-16 py-32 md:h-screen px-8 overflow-hidden ">
        <div className="absolute pointer-events-none inset-[-50rem] scale-75 bg-[url('/svgs/city.svg')] bg-center bg-no-repeat blur-[8px] opacity-100" />
        <h2 className="text-header2 font-semibold">
          {home.HomeText.header2[1]}
        </h2>
        <p className=" max-w-[76ch] md:text-base mb-8">
          {home.HomeText.paragraph[2]}
        </p>

        <div className="flex flex-col md:flex-row  gap-4  ">
          <SquareButton
            variant="white"
            text="CASEIT History"
            subtext="Learn about the CaseIT evolution"
            link="/history"
          />
          <SquareButton
            variant="white"
            text="Our 2025 Recap"
            subtext="Relive some of our best moments"
            link="/history/recap"
          />
          <SquareButton
            variant="white"
            text="PIVOT"
            subtext="Our local rendition for BC students"
            link="https://pivot.caseit.org/"
          />
        </div>
      </section>
      {/* LIVECHAT CODE */}
      {/* Uncomment and set "Overview > Status" and "Channels > Chat Widget > Widget Status" to Active on TawkTo */}
      <section>
        <TawkTo />
      </section>
    </main>
  );
}
