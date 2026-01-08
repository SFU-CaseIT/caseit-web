import { Metadata } from "next";
import { DiscoverITBanner } from "@/components/subpageBanner";
import {
  Bento,
  BentoText,
  OverviewMap,
} from "@/components/pages/discoverITItems";
import { overviewText } from "@/content/discoverIT_content";
import { RoundedButton } from "@/components/buttons";
import { BoldedText } from "@/components/text";

export const metadata: Metadata = {
  title: "DiscoverIT - Overview",
  description: "Learn more about our company and team.",
};

export default function Overview() {
  return (
    <div className="py-[20vh] px-7 md:px-16 xl:px-[15vw]">
      {/* ---MAIN NAV--- */}
      <div className="pb-8">
        <DiscoverITBanner></DiscoverITBanner>
      </div>

      {/* ---TOP BENTO--- */}
      <section className="pb-6">
        <Bento>
          {" "}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BentoText
              title={overviewText.title[0]}
              text={overviewText.paragraph[0]}
            ></BentoText>{" "}
          </div>{" "}
        </Bento>
      </section>

      {/* ---BOTTOM BENTO--- */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ---LEFT--- */}
        <Bento>
          <BentoText
            title={overviewText.title[1]}
            text={overviewText.paragraph[1]}
          ></BentoText>
          <div className="mt-8 md:mt-auto">
            <RoundedButton
              text="Explore"
              link="/2025/DiscoverIT/CaptureIT"
              variant="red"
            />
          </div>
        </Bento>
        {/* ---RIGHT--- */}
        <Bento>
          {" "}
          <div className="flex flex-col space-y-4">
            <BentoText
              title={overviewText.title[2]}
              text={overviewText.paragraph[2]}
            ></BentoText>
            <BoldedText text={overviewText.paragraph[3]}></BoldedText>
            <BoldedText text={overviewText.paragraph[4]}></BoldedText>
          </div>
        </Bento>
      </section>
      {/* ---GOOGLE MAP--- */}
      <section className="mt-6">
        <OverviewMap />
      </section>
    </div>
  );
}
