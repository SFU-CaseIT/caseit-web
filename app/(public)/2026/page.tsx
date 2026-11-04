import { Metadata } from "next";
import caseitChair from "@/public/imgs/chair/2026/caseitChair.jpg";
import sponsor from "@/public/imgs/2025_sponsor.png";
import discover from "@/public/imgs/2025_discover.png";
import { BgImgCenter } from "@/components/img";
import { CaseItCountdown } from "@/components/CaseItCountdown";
import { ArrowButton } from "@/components/buttons";
import banner from "@/public/imgs/banners/2025_banner.png";
import { ImgButton } from "@/components/ImgButton";
export const metadata: Metadata = {
  title: "CaseIT 2027",
  description:
    "Discover CaseIT 2027, taking place in Vancouver from February 14–19, and explore competition information and events.",
};

export default function CaseIt2027() {
  return (
    <div>
      {/* ---MAIN BANNER--- */}
      <section id="2027" className="">
        <BgImgCenter img={banner}>
          <div className="text-header1 pb-8 leading-none">
            Ready for iT?
          </div>
          <div className="w-full sm:w-[60vw] md:w-[80vw] lg:w-[90vw] xl:w-[80%]">
            {/* The time format is yyyy-mm-dd, please make sure it's in this format*/}
            <CaseItCountdown year={2027} localDate="2027-02-14" timeZone="America/Vancouver" label="CaseIT Feb 14-19, 2027"/> 
          </div>
        </BgImgCenter>
      </section>
      {/* ---COMPETITION INFORMATION--- */}
      <section className="site-container my-10 flex flex-col items-center justify-center">
        <h2 className="mx-auto w-fit font-semibold text-[2rem]  md:text-[2.5rem]">
          Competition Information
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
              alt={"Sponsorship opportunities"}
              text={"Sponsorship Opportunities"}
              link={"/sponsor/Sponsorship-Opportunities"}
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
      <section className="md:hidden flex justify-center mx-auto scroll-smooth py-[7vh]">
        <ArrowButton link="#2027" />
      </section> 
    </div>
  );
}
