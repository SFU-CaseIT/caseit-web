import { Metadata } from "next";
import caseitChair from "@/public/imgs/chair/2026/caseitChair.jpg";
import sponsor from "@/public/imgs/2025_sponsor.png";
import discover from "@/public/imgs/2025_discover.png";
import { BgImgCenter } from "@/components/img";
import * as content from "@/content/2025_content";
import * as contents from "@/content/2026_content"
import DivisionTable from "@/components/pages/DisivionTable";
import { Stats } from "../../components/2025components/Stats";
import { CaseItCountdown } from "../../components/CaseItCountdown";
import { ArrowButton } from "@/components/buttons";
import banner from "@/public/imgs/banners/2025_banner.png";
import { ImgButton } from "@/components/ImgButton";
import { Results } from "@/components/2025components/results";
import Image from "next/image";
export const metadata: Metadata = {
  title: "CaseIT 2026",
  description: "Learn more about our company and team.",
};

export default function CaseIt2026() {
  return (
    <div>
      {/* ---MAIN BANNER--- */}
      <section id="2026" className="">
        <BgImgCenter img={banner}>
          <div className="text-header1 pb-8 leading-none">
            {content.caseit2025Text.header1}
          </div>
          <div className="w-full sm:w-[60vw] md:w-[80vw] lg:w-[90vw] xl:w-[80%]">
            {/* The time format is yyyy-mm-dd, please make sure it's in this format*/}
            <CaseItCountdown year={2026} localDate="2026-02-15" timeZone="America/Vancouver" label="CaseIT Feb 15-20, 2026"/> 
          </div>
        </BgImgCenter>
      </section>
      <section>
        {/* <div className="flex gap-2 flex-col md:items-center p-8">
          <h2 className="text-redDark font-semibold text-header3 md:text-header2">
            {content.caseit2025Text.header2[2]}
          </h2>
          <div className="flex flex-col md:flex-row md:justify-center md:gap-16 lg:gap-24">
            {content.stats.map((stat, index) => (
              <Stats key={index} title={stat} />
            ))}
          </div>
          {content.boldText.section_2_Pargraph}
        </div> */}
      </section>
      {/* ---COMPETITION INFORMATION--- */}
      <section className="flex flex-col justify-center items-center px-4 md:px-8 xl:px-20 md:mx-auto max-w-[1920px] my-10">
        <h2 className="mx-auto w-fit font-semibold text-[2rem]  md:text-[2.5rem]">
          {content.boldText.section_3_Title}
        </h2>

        {/* ---3 BUTTON GRID---  */}
        <div className="my-6 grid grid-cols-1 md:grid-cols-5 md:grid-rows-2 gap-6 sm:max-w-[80vw] lg:max-w-[60vw]">
          <div className="group relative md:row-span-2 md:col-span-2 aspect-video md:aspect-[0] ">
            <ImgButton
              img={caseitChair}
              alt={"case it chair"}
              text={"Chair's Welcome"}
              link={"/2026/chair"}
            />
          </div>
          <div className="relative group md:col-start-3 md:col-span-3 md:aspect-[2]">
            <ImgButton
              img={sponsor}
              alt={"2026 Sponsors"}
              text={"2026 Sponsors"}
              link={"/sponsor/Sponsor-Overview"}
            />
          </div>
          <div className=" group relative md:col-start-3 md:col-span-3 md:aspect-[2]">
            <ImgButton
              img={discover}
              alt={"DiscoverIT"}
              text={"DiscoverIT"}
              link={"/2026/DiscoverIT/overview"}
            />
          </div>
        </div>
      </section>
      {/* ---COMP WEEK RESULTS - LIVE UPDATES--- */}
      <section className="my-[20vh] flex flex-col gap-4 p-7 md:p-0 md:max-w-[80vw] mx-auto">
        <div className="font-semibold text-[2rem] text-center md:text-[2.5rem] pb-8">
          {contents.caseit2026Text.header2[1]}
        </div>
        {contents.compWeek.caseOne}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-12 lg:gap-x-12 2xl:gap-x-1 w-full max-w-full mx-auto">
          {contents.caseOneDivisionDraw.map((division) => (
            <div key={division.title}>
              <DivisionTable title={division.title} variant="divisionDraw" data={division.data} />
            </div>
          ))}
        </div>
        <div className="mt-8">
          {contents.compWeek.caseOneWinner}
        </div>
        <DivisionTable title={contents.caseOneDivisionWinners.title} variant="divisionWinner" data={contents.caseOneDivisionWinners.data}/>

        <div className="mt-8">
          {contents.compWeek.caseTwoWinner}
        </div>
        <DivisionTable title={contents.caseOneDivisionWinners.title} variant="divisionWinner" data={contents.caseTwoDivisionWinners.data}/>

      </section>
      <section className="md:hidden flex justify-center mx-auto scroll-smooth py-[7vh]">
        <ArrowButton link="#2026" />
      </section> 
    </div>
  );
}
