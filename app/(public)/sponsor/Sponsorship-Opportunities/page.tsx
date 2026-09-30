import { Metadata } from "next";
import { BgImgLeft } from "@/components/img";
import * as sponsor from "@/content/sponsor_content";
import { SponsorBanner, SponsorOpCards } from "@/components/pages/sponsorItems";
import { MobileButtons } from "@/components/pages/sponsorItems";

export const metadata: Metadata = {
  title: "Sponsorship Opportunities",
  description: "Learn more about our company and team.",
};

export default function SponsorOpps() {
  return (
    <div>
      {/* ---MAIN BANNER--- */}
      <section id="SponsorshipOpportunities">
        <BgImgLeft>
          <SponsorBanner
            title={sponsor.sponsorOppsText.header2}
            subtext={sponsor.sponsorOppsText.subtext}
            text={sponsor.sponsorOppsText.desc}
          >
            <MobileButtons text="Overview" link="/sponsor/Sponsor-Overview" />
          </SponsorBanner>
        </BgImgLeft>
      </section>
      {/* ---SPONSOR CARDS--- */}
      <section>
        <div>
          {sponsor.sponsorOpportunitiesContent.sponsOp.map((item, index) => (
            <div key={index}>
              <SponsorOpCards
                title={sponsor.sponsorOpportunitiesContent.sponsOp[index].title}
                subtext={
                  sponsor.sponsorOpportunitiesContent.sponsOp[index].subtext
                }
                text={sponsor.sponsorOpportunitiesContent.sponsOp[index].text}
                img={sponsor.sponsorOpportunitiesContent.sponsOp[index].img}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
