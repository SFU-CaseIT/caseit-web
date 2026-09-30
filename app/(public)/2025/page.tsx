import { Metadata } from "next";
import caseitChair from "@/public/imgs/chair/2025/caseitChair.jpg";
import sponsor from "@/public/imgs/2025_sponsor.png";
import discover from "@/public/imgs/2025_discover.png";
import { BgImgCenter } from "@/components/img";
import * as content from "@/content/2025_content";
import { Stats } from "@/components/2025components/Stats";
import { CaseItCountdown } from "@/components/CaseItCountdown";
import { ArrowButton } from "@/components/buttons";
import banner from "@/public/imgs/banners/2025_banner.png";
import { ImgButton } from "@/components/ImgButton";
import { Results } from "@/components/2025components/results";
import Image from "next/image";
import { ImgRibbonLeft, ImgRibbonRight } from "@/components/imgRibbons";
import { WinnersText } from "@/components/text";
export const metadata: Metadata = {
  title: "CaseIT 2025",
  description: "Learn more about our company and team.",
};

export default function CaseIt2025() {
  return (
    <div>
      {/* ---MAIN BANNER--- */}
      <section id="2025" className="mb-[10vh]">
        <BgImgCenter img={banner}>
          <div className="text-header1 pb-8 leading-none">
            {content.caseit2025Text.header1}
          </div>
          <div className="w-full sm:w-[60vw] md:w-[80vw] lg:w-[90vw] xl:w-[80%]">
            <CaseItCountdown year={2025} localDate={"2025-02-16"} label="CaseIT Feb 16-21, 2025"/>
          </div>
        </BgImgCenter>
      </section>
      <section>
        <div className="flex gap-2 flex-col md:items-center p-8">
          <h2 className="text-redDark font-semibold text-header3 md:text-header2">
            {content.caseit2025Text.header2[2]}
          </h2>
          <div className="flex flex-col md:flex-row md:justify-center md:gap-16 lg:gap-24">
            {content.stats.map((stat, index) => (
              <Stats key={index} title={stat} />
            ))}
          </div>
          {content.boldText.section_2_Pargraph}
        </div>
      </section>
      {/* ---COMPETITION INFORMATION--- */}
      <section className="flex flex-col justify-center items-center px-4 md:px-8 xl:px-20 md:mx-auto max-w-[1920px]">
        <h2 className="mx-auto w-fit mt-8 font-semibold text-[2rem]  md:text-[2.5rem]">
          {content.boldText.section_3_Title}
        </h2>
        {/* ---3 BUTTON GRID---  */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-5 md:grid-rows-2 gap-6 sm:max-w-[80vw] lg:max-w-[60vw]">
          <div className="group relative md:row-span-2 md:col-span-2 aspect-video md:aspect-[0] ">
            <ImgButton
              img={caseitChair}
              alt={"case it chair"}
              text={"Chair's Welcome"}
              link={"/2025/chair"}
            />
          </div>
          <div className="relative group md:col-start-3 md:col-span-3 md:aspect-[2]">
            <ImgButton
              img={sponsor}
              alt={"2025 Sponsors"}
              text={"2025 Sponsors"}
              link={"/sponsor/Sponsor-Overview"}
            />
          </div>
          <div className=" group relative md:col-start-3 md:col-span-3 md:aspect-[2]">
            <ImgButton
              img={discover}
              alt={"DiscoverIT"}
              text={"DiscoverIT"}
              link={"/2025/DiscoverIT/overview"}
            />
          </div>
        </div>
      </section>
      {/* ---COMP WEEK RESULTS - LIVE UPDATES--- */}
      <section className="my-[20vh] flex flex-col gap-4 p-7 md:p-0 md:max-w-[80vw] mx-auto">
        <div className="font-semibold text-[2rem] text-center md:text-[2.5rem] pb-8">
          {content.caseit2025Text.header2[1]}
        </div>

        {content.compWeek.caseOne}

        <div className="grid md:grid-cols-2 gap-4">
          {content.caseOneImgs.map((item, index) => (
            <div key={index}>
              <Image
                className="w-full"
                src={item.src}
                alt={item.src}
                width={500}
                height={450}
              />
            </div>
          ))}
        </div>

        <Results
          img2="/imgs/compWeek/2025/C1_win.png"
          img1="/imgs/compWeek/2025/C1_mobile.png"
          alt="case 1 winner"
          title={content.compWeek.caseOneWinner}
        />

        <Results
          img2="/imgs/compWeek/2025/C2_win.png"
          img1="/imgs/compWeek/2025/C2_mobile.png"
          alt="case 2 winner"
          title={content.compWeek.caseTwoWinner}
        />
      </section>
      <section className="bg-sectionBlack">
        <div className="text-header2 text-white flex justify-center py-20">
          {content.caseit2025Text.header2[3]}
        </div>
      </section>
      <section className="flex flex-col space-y-[10vh] md:space-y-[20vh]  py-20">
        {/* Parses through each photo based on the content arrays - Edit the content to alter the photos  */}
        {content.winners.map((item, index) => (
          <div key={index}>
            {index % 2 === 0 ? (
              <ImgRibbonRight
                img={content.winners[index].img}
                alt={content.winners[index].alt}
              >
                <WinnersText
                  title={content.winners[index].title}
                  subtext={content.winners[index].place}
                />
              </ImgRibbonRight>
            ) : (
              <ImgRibbonLeft
                img={content.winners[index].img}
                alt={content.winners[index].alt}
              >
                <WinnersText
                  title={content.winners[index].title}
                  subtext={content.winners[index].place}
                />
              </ImgRibbonLeft>
            )}
          </div>
        ))}
      </section>

      {/* ---COMPETITION INFORMATION SCHEDULE--- */}
      {/* <section className=" mt-24 gap-4 flex flex-col items-center">
        <h2 className=" font-semibold text-[2rem]  md:text-[2.5rem]">
          {content.caseit2025Text.header2}
        </h2>
        <CaseItEvent />
        <p className="text-paragraph  p-7">
          {content.caseit2025Text.disclaimer}
        </p>
      </section> */}

      {/* ---Hidden square buttons---  */}
      {/*
      <section className="w-full flex justify-center mt-6 py-[10vh]">
       <div className="flex hidden md:flex items-center justify-center gap-4">
          <SquareButton
            variant="black"
            text="Rulebook"
            subtext="Learn about the rules this year."
            link="/history"
          />
          <SquareButton
            variant="black"
            text="Competitor Handbook"
            subtext="Prepare fo the competition."
            link="/history"
          />
          <SquareButton
            variant="black"
            text="Livestreams"
            subtext="Tune into CaseIT signature events."
            link="/history"
          />
        </div> 
          </section>*/}
      <section className="md:hidden flex justify-center mx-auto scroll-smooth py-[7vh]">
        <ArrowButton link="#2025" />
      </section>
    </div>
  );
}
