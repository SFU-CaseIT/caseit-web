"use client";
import { RoundedButton } from "@/components/buttons";
import Image from "next/image";
import { BoldedText, NewLineText} from "../text";
import SubpageBanner from "../subpageBanner";

type sponsorItems = {
  text?: string;
  link?: string;
  title?: string;
  subtext?: string;
  img?: string;
  alt?: string;
  children?: React.ReactNode;
};

// BANNER NAV COMPONENTS
export const MobileButtons = ({ text, link }: sponsorItems) => {
  return (
    <div className="flex flex-col space-y-3 ">
      <div className="md:hidden">
        <RoundedButton text={text} link={link || ""} variant="outline" />
      </div>
      <RoundedButton text="Talk to Our Team" link="/contact" variant="red" />
    </div>
  );
};
//FOR SPONSOR OVERVIEW AND OPP
export const SponsorBanner = ({
  subtext,
  title,
  text,
  children,
}: sponsorItems) => {
  return (
    <div className="w-full flex items-center justify-center md:justify-start">
      <div className="flex flex-col space-y-[2vh] max-w-[85vw] md:max-w-[50vw] xl:max-w-[40vw] mx-auto md:mx-[5vw] xl:mx-[10vw] text-left">
        <div>
          {/* MOBILE LINK */}
          <div className="md:hidden text-redDark font-bold">{subtext}</div>
          {/* DESKTOP LINK */}
          <div className="space-x-[3rem] flex text-redDark font-bold hidden md:flex mb-[1vh]">
            <SubpageBanner link="/sponsor/Sponsor-Overview" title="Overview" />
            <SubpageBanner
              link="/sponsor/Sponsorship-Opportunities"
              title="Sponsorship Opportunities"
            />
          </div>
          <div className="text-header2">{title}</div>
        </div>
        <div className="text-paragraph pb-[5vh]">
          <BoldedText text={text}></BoldedText>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
};

export const SponsorOverviewRibbonText = ({ title, text }: sponsorItems) => {
  return (
    <div className="md:pl-10">
      <div className="text-header3 md:text-header2 text-red leading-[2.5rem]">
        {title}
      </div>
      <div className="md:max-w-[50vw] pb-[2vh] pr-[3vw]">
        <div className="text-paragraph pt-[2vh]">
          <NewLineText text={text}></NewLineText>
        </div>
      </div>
    </div>
  );
};
export const SponsorOpCards = ({
  title,
  text,
  subtext,
  img,
  alt,
}: sponsorItems) => {
  return (
    <div className="flex flex-col-reverse md:flex-row mx-auto justify-center items-center max-w-[90vw] md:shadow-[0_0_10px_rgba(0,0,0,0.3)] md:max-w-[80vw] md:rounded-[1rem] md:border-2 md:border-borderGrey md:px-[7vw] py-[15vh] my-[10vh]">
      <div className="min-w-0 md:min-w-[50%] py-[10%] md:py-0 mx-auto ">
        <Image
          src={img || "/svgs/sponsorIcon1.svg"}
          alt={alt || "Various icons with subheadders"}
          width={463}
          height={313}
        />
      </div>
      <div className="md:max-w-[80%] pl-5 mx-auto">
        <div className="text-header2 text-red pb-2">{title} </div>
        <div className="text-paragraph font-bold pb-6">{subtext}</div>
        <NewLineText text={text} />
      </div>
    </div>
  );
};
