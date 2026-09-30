import { Metadata } from "next";
import { BgImgLeft } from "@/components/img";
import * as sponsor from "@/content/sponsor_content";
import { ImgRibbonLeft, ImgRibbonRight } from "@/components/imgRibbons";
import {
  SponsorOverviewRibbonText,
  SponsorBanner,
  SponsorTiles,
  MobileButtons,
} from "@/components/pages/sponsorItems";
import { RoundedButton, ArrowButton } from "@/components/buttons";

export const metadata: Metadata = {
  title: "Sponsor Overview",
  description: "Learn more about our company and team.",
};

export default function SponsorOverview() {
  return (
    <div>
      {/* ---MAIN BANNER--- */}
      <section id="sponOpp">
        <BgImgLeft>
          <SponsorBanner
            title={sponsor.sponsorOverviewText.header2[0]}
            subtext={sponsor.sponsorOverviewText.subtext}
            text={sponsor.sponsorOverviewText.desc}
          >
            <MobileButtons
              text="Sponsorship Opportunities"
              link="/sponsor/Sponsorship-Opportunities"
            />
          </SponsorBanner>
        </BgImgLeft>
      </section>
      {/* ---SPONSOR TILES--- */}
      <section className="flex flex-col justify-center ">
        <div className="text-header3 md:text-header2 md:text-center px-7 py-[8vh]">
          {sponsor.sponsorTileContent.sectionTitle[0].title}
        </div>
        <div className="max-w-[80vw] mx-auto grid grid-cols-2 grid-rows-6 grid-flow-row gap-[1.644rem] md:gap-[6.5rem] md:grid-cols-3 md:grid-rows-4 lg:gap-[4rem] lg:grid-cols-3 lg:grid-rows-4 lg:p-[8%] xl:grid-cols-4 xl:grid-rows-3 ">
          {sponsor.sponsorTileContent.sponsors.map((item, index) => (
            // Populated by the content
            <div key={index}>
              <SponsorTiles
                img={item.img}
                text={item.text}
                alt={item.alt}
              />
            </div>
          ))}
        </div>
      </section>
      {/* ---INFO AND IMGS--- */}
      <section>
        <div className="text-header3 md:text-header2 text-center pt-[5rem] md:py-[7.5rem]">
          {sponsor.sponsorOverviewText.sectionTitle[0].title}
        </div>
        <div className="flex flex-col space-y-[10vh] md:space-y-[20vh]">
          {sponsor.sponsorOverviewText.ribbons.map((item, index) => (
            <div key={index}>
              {index % 2 === 0 ? (
                <ImgRibbonRight
                  img={sponsor.sponsorOverviewText.ribbons[index].img}
                  alt={sponsor.sponsorOverviewText.ribbons[index].alt}
                >
                  <SponsorOverviewRibbonText
                    text={sponsor.sponsorOverviewText.ribbons[index].desc}
                    title={sponsor.sponsorOverviewText.ribbons[index].title}
                  />
                </ImgRibbonRight>
              ) : (
                <ImgRibbonLeft
                  img={sponsor.sponsorOverviewText.ribbons[index].img}
                  alt={sponsor.sponsorOverviewText.ribbons[index].alt}
                >
                  <SponsorOverviewRibbonText
                    text={sponsor.sponsorOverviewText.ribbons[index].desc}
                    title={sponsor.sponsorOverviewText.ribbons[index].title}
                  />
                </ImgRibbonLeft>
              )}
            </div>
          ))}
        </div>
      </section>
      {/* ---PLUG---  */}
      <section className="flex justify-center pt-[7rem]">
        <div>
          <div className="flex flex-col text-center max-w-[80vw]">
            <h2 className="text-header2">
              {sponsor.sponsorOverviewText.header2[1]}
            </h2>
            <p className="py-[1.6rem] max-w-[100vw] xs:max-w-[30vw] md:max-w-[30vw] self-center">
              {sponsor.sponsorOverviewText.plug}
            </p>
            <RoundedButton
              text="Explore Sponsorship Opportunities"
              link="/sponsor/Sponsorship-Opportunities"
              variant="outline"
            />
          </div>
        </div>
      </section>
      <section className="flex justify-center mx-auto scroll-smooth py-[7vh]">
        <ArrowButton link="#sponOpp" />
      </section>
    </div>
  );
}
