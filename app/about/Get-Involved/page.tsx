import { Metadata } from "next";
import { RoundedButton, ArrowButton } from "@/components/buttons";
import { BgImgCenter } from "@/components/img";
import banner from "@/public/imgs/banners/2025_banner.png";
import * as involved from "@/content/involved_content";
import Carousel from "@/components/Carousel";

export const metadata: Metadata = {
  title: "Get Involved",
  description: "Learn more about our company and team.",
};

const isHiring: boolean = false;

export default function GetInvolved() {
  return (
    <div>
      {/* ---MAIN BANNER---  */}
      <section>
        <BgImgCenter img={banner}>
          <div className="flex flex-col  items-center">
            <div className="text-redDark text-center text-header2">
              {involved.involvedText.red}
            </div>
            {/* Title */}
            <div className="text-header1 text-center pb-8 lg:max-w-[50vw]">
              {involved.involvedText.header1}
            </div>
            {/* Buttons */}
            {
              isHiring &&
                <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                  <RoundedButton
                    text="Apply now"
                    link="/history" // link to application form
                    variant="black"
                    state={isHiring ? "default" : "disabled"}
                  />
                  <RoundedButton
                    text="View 2025 Recruitment Package"
                    link="https://drive.google.com/file/d/1HCsRQMqF7GNQhONxv8tj46uEhxcn__Mt/view"
                    variant="black"
                  />
                </div>
            }
          </div>
        </BgImgCenter>
      </section>
      {/* ---CAROUSEL SECTION--- */}
      <section className="  mt-24 ">
        <h2 className=" text-header2 ml-8 lg:ml-32 mb-12 max-w-[24ch] tracking-tight leading-tight">
          {involved.involvedText.header2[0]}
        </h2>
        <Carousel />
      </section>
      {/* ---PLUG--- */}
      <section className="flex flex-col justify-center items-center gap-6 py-28 px-4">
        <h2 className="text-header2 text-center">
          {involved.involvedText.header2[1]}
        </h2>
        <p className="text-lg text-center max-w-[55ch] ">
          {involved.involvedText.paragraph}
        </p>
        <RoundedButton
          text="Our Instagram"
          link="https://www.instagram.com/caseitsfu/?hl=en"
          variant="black"
        />
      </section>
    </div>
  );
}
