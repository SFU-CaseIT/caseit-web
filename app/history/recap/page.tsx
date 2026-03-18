import { Metadata } from "next";
import * as re from "@/content/recap_content";
import { ImgRibbonLeft, ImgRibbonRight } from "@/components/imgRibbons";
import { RecapCards } from "@/components/pages/recapItems";
import { BgImgCenter } from "@/components/img";
import { RecapText } from "@/components/text";
import { RoundedButton, ArrowButton } from "@/components/buttons";
import banner from "@/public/imgs/banners/recap_banner.png";

const year = 2026;

export const metadata: Metadata = {
  title: `${year} Recap`,
  description: "Learn more about our company and team.",
};

export default function RecapPage() {

  return (
    <div>
      {/* ---MAIN BANNER--- */}
      <section id="recap">
        <BgImgCenter img={banner}>
          <div className="text-header1 pb-[5vh]  leading-none">
            {re.recapText.header1}
          </div>
          <div className="flex flex-col-reverse md:flex-row justify-center items-center md:space-x-[20px] ">
            <div>
              <RoundedButton
                text={`${year} Media Gallery`}
                link="https://1sfu-my.sharepoint.com/:f:/g/personal/caseit_sfu_ca/IgB_53eTNPc6RbvXhPQTTDocAbWtvMrMuAo22Ip5tANl0Ik?e=Bh07dJ"
                variant="red"
              />
            </div>
            <div className="mb-4 md:mb-0">
              <RoundedButton
                text={`View CaseIT ${year} Recap Video`}
                link="/history/media"
                variant="black"
              />
            </div>
          </div>
        </BgImgCenter>
      </section>
      {/* ---INFO AND IMGS--- */}
      <section className="flex flex-col space-y-[3rem] md:space-y-[4rem]">
        {re.recapText.positions.map((item, index) => (
          <div key={index}>
            {index % 2 === 0 ? (
              <ImgRibbonRight
                img={item.img}
                alt={item.alt}
              >
                <RecapText
                  subtext={item.day}
                  text={item.desc}
                  title={item.title}
                />
                {item.title2 && (
                  <RecapText
                    text={item.desc2}
                    title={item.title2}
                  />
                )}
              </ImgRibbonRight>
            ) : (
              <ImgRibbonLeft
                img={item.img}
                alt={item.alt}
              >
                <RecapText
                  subtext={item.day}
                  text={item.desc}
                  title={item.title}
                />
                {item.title2 && (
                  <RecapText
                    text={item.desc2}
                    title={item.title2}
                  />
                )}
              </ImgRibbonLeft>
            )}
          </div>
        ))}
      </section>{" "}
      {/* ---Winner Cards--- */}
      <section className="flex flex-col space-y-[3rem] md:space-y-[4rem] py-[20vh]">
        {/* titles */}
        <div className="flex flex-col mx-auto text-center ">
          <text className="text-red text-header4">{re.recapText.header4}</text>
          <text className="text-header3">{re.recapText.header3}</text>
        </div>
        {/* cards  */}
        <div className="grid mx-auto max-w-[80vw] md:max-w-[60vw]  gap-5">
          {re.recapCardText.map((item, index) => (
            <div
              key={index}
              className={`${
                re.recapCardText.length % 2 !== 0 &&
                index === re.recapCardText.length - 1
                  ? "md:col-span-2 flex justify-center"
                  : ""
              }`}
            >
              <RecapCards
                title={item.title}
                subtext={item.subtext}
                img={item.img}
              />
            </div>
          ))}
        </div>
      </section>
      <div className="flex justify-center pb-[15vh]">
        <ArrowButton link="#recap" />
      </div>
    </div>
  );
}
