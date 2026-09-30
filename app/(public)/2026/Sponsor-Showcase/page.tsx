import { Metadata } from "next";
import { BgImgCenter } from "@/components/img";
import * as sponsor from "@/content/sponsor_content";
import { ImgRibbonRight } from "@/components/imgRibbons";
import {
  SponsorShowcaseRibbons,
  TechSponsor,
  SponsorTiles,
  SilverSponsor,
  DiamondSponsor,
} from "@/components/pages/sponsorItems";
import { RoundedButton, ArrowButton } from "@/components/buttons";

export const metadata: Metadata = {
  title: "Media Gallery",
  description: "Learn more about our company and team.",
};

export default function SponsorShowcase() {
  return (
    <div>
      {/* ---MAIN BANNER--- */}
      <section id="sponShow">
        <BgImgCenter>
          <div className="text-start md:text-center">
            <div className="text-header1">
              {sponsor.sponsorShowcaseBannerText.header1}
            </div>
            <div className="text-paragraph pb-[3vh] md:pb-[5vh] md:max-w-[55vw]">
              {sponsor.sponsorShowcaseBannerText.subtext}
            </div>
            <RoundedButton
              text="Learn More About CaseIT"
              link="/2025/Sponsor-Showcase"
              variant="red"
            />
          </div>
        </BgImgCenter>
      </section>
      {/* ---TITLE SPONSORS--- */}
      <section className="flex flex-col space-y-[10vh]">
        {sponsor.titleSponsorContent.map((item, index) => (
          <div key={index}>
            <ImgRibbonRight
              img={sponsor.titleSponsorContent[index].img}
              alt={sponsor.titleSponsorContent[index].alt}
            >
              <SponsorShowcaseRibbons
                text={sponsor.titleSponsorContent[index].desc}
                title={sponsor.titleSponsorContent[index].title}
                img={sponsor.titleSponsorContent[index].logoImg}
                alt={sponsor.titleSponsorContent[index].logoAlt}
              />
            </ImgRibbonRight>
          </div>
        ))}
      </section>
      {/* ---DIAMOND SPONSORS--- */}
      <section className=" px-7 mx-auto flex flex-col md:flex-row md:gap-[8rem] max-w-[90vw] space-y-12 md:space-y-0 py-[10vh] justify-center">
        {sponsor.diamondSponsorContent.map((item, index) => (
          <DiamondSponsor
            key={index}
            text="Diamond Sponsor"
            img={sponsor.diamondSponsorContent[index].img}
            alt={sponsor.diamondSponsorContent[index].alt}
          />
        ))}
      </section>
      {/* ---TECH SPONSORS--- */}
      <section>
        <TechSponsor
          title={sponsor.techSponsorContent.header1}
          subtext={sponsor.techSponsorContent.subtext}
          text={sponsor.techSponsorContent.text}
          img={sponsor.techSponsorContent.img}
          logo={sponsor.techSponsorContent.logo}
          alt={sponsor.techSponsorContent.alt}
        />
      </section>

      {/* ---SILVER SPONSORS--- */}
      <section className=" px-7 mx-auto flex flex-col md:flex-row md:gap-[8rem] max-w-[90vw] space-y-12 md:space-y-0 py-[10vh]">
        {sponsor.caseSponsorContent.map((item, index) => (
          <SilverSponsor
            key={index}
            title={sponsor.caseSponsorContent[index].header1}
            subtext={sponsor.caseSponsorContent[index].subtext}
            text={sponsor.caseSponsorContent[index].text}
            img={sponsor.caseSponsorContent[index].img}
            alt={sponsor.caseSponsorContent[index].alt}
          />
        ))}
      </section>
      {/* ---IN-KIND SPONSOR TILES--- */}
      <section className="flex flex-col justify-center items-center py-[2.5vh]">
        <div className="text-header3 text-red text-center pb-[2.5vh]">
          {sponsor.inkindSponsorTileContent.title}
        </div>
        <div className="max-w-[80vw] items-center mx-auto grid grid-cols-2 grid-rows-6 grid-flow-row gap-[1.644rem] md:gap-[6.5rem] md:grid-cols-3 md:grid-rows-4 lg:gap-[4rem] lg:grid-cols-3 lg:grid-rows-4 lg:p-[8%] xl:grid-cols-4 xl:grid-rows-3 ">
          {sponsor.inkindSponsorTileContent.sponsors.map((item, index) => (
            <div key={index} className="bg-white rounded-full flex items-center justify-center overflow-hidden p-4 w-40 h-40 sm:w-48 sm:h-48 lg:p-3 sm:drop-shadow-[0_0_33px_rgba(0,0,0,0.1)] sm:hover:drop-shadow-[0_0_15px_rgba(210,121,128,0.8)] transition-all ">
              <SponsorTiles
                img={item.img}
                alt={item.alt}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ADD AFTER COMP WEEK */}
      {/* ---THANK YOU SECTION--- */}
      <section className="bg-greyDark py-[10vh]">
        <div className="flex flex-col mx-auto text-center content-center md:max-w-[50vw] space-y-8 px-7">
          <div className="text-header2 text-red leading-none">
            {sponsor.sponsorThankContent.header1}
          </div>
          <div className="text-paragraph">
            {sponsor.sponsorThankContent.text}
          </div>

          <div className="text-paragraph font-bold">
            {sponsor.sponsorThankContent.bold}
          </div>
          <RoundedButton
            text="Explore Sponsorship Opportunities"
            link="/sponsor/Sponsorship-Opportunities"
            variant="red"
          />
        </div>
      </section>
      <section className="md:hidden flex justify-center mx-auto scroll-smooth py-[7vh]">
        <ArrowButton link="#sponShow" />
      </section>
    </div>
  );
}
