import { Metadata } from "next";
import { DiscoverITBanner } from "@/components/subpageBanner";
import {
  CaptureITBanner,
  CaptureITCard,
  CaptureITPosts,
} from "@/components/pages/discoverITItems";
import {
  CaptureITBannerText,
  CaptureITCardText,
  CaptureITImgs,
} from "@/content/discoverIT_content";
export const metadata: Metadata = {
  title: "DiscoverIT - CaptureIT",
  description: "Learn more about our company and team.",
};

export default function CaptureIT() {
  return (
    <div className="py-[20vh] px-7 md:px-16 xl:px-[15vw]">
      {/* ---MAIN NAV--- */}
      <div className="pb-8">
        <DiscoverITBanner></DiscoverITBanner>
      </div>
      <section className="md:flex md:flex-col lg:grid lg:grid-cols-2">
        <div className="pb-[10vh]">
          {/* ---INTRO PRAGRAPH--- */}
          <CaptureITBanner
            title={CaptureITBannerText.title}
            paragraph={CaptureITBannerText.paragraph}
          />
          {/* ---EACH SECTION--- */}
          {CaptureITCardText.content.map((item, index) => (
            <div key={index}>
              <CaptureITCard
                title={CaptureITCardText.content[index].header}
                text={CaptureITCardText.content[index].paragraph}
              />
            </div>
          ))}
        </div>
        {/* ---IMAGES--- */}
        <div className="pb-6">
          {CaptureITImgs.imgs.map((item, index) => (
            <div key={index}>
              <CaptureITPosts img={CaptureITImgs.imgs[index]} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
