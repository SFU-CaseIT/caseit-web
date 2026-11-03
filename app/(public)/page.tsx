import * as home from "@/content/home_content";
import { SquareButton } from "@/components/buttons";
import { TextDot } from "@/components/text";
import HeroSection from "@/components/HeroSection";
import Image from "next/image";
import StatsGrid from "@/components/StatsGrid";
import { BoldedText } from "@/components/text";

export default function Home() {
  const stats = [
    { label: "Competitors", count: 64 },
    { label: "Teams", count: 16 },
    { label: "Days", count: 6 },
    { label: "Cases", count: 2 },
    { label: "Competition", count: 1 },
  ];

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
        <StatsGrid stats={stats} />
        {/* Vancouver card  */}
        <div className="  mt-12 flex flex-col  border-redDark border-2 rounded-2xl gap-12 p-4 md:p-6 xl:p-10 w-[90%] max-w-[25rem] md:max-w-[1200px] mx-auto drop-shadow-[0_0_15px_rgba(197,52,52,0.25)] bg-white text-center">
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

        <div className="flex flex-col md:flex-row gap-4">
          <SquareButton
            variant="white"
            text="PIVOT"
            subtext="Our local rendition for BC students"
            link="https://pivot.caseit.org/"
          />
        </div>
      </section>
    </main>
  );
}
