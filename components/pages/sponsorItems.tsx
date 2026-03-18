"use client";
import { RoundedButton } from "@/components/buttons";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { BoldedText, NewLineText, NewLineText2 } from "../text";
import SubpageBanner from "../subpageBanner";

type sponsorItems = {
  text?: string;
  link?: string;
  title?: string;
  subtext?: string;
  img?: string;
  alt?: string;
  logo?: string;
  children?: React.ReactNode;
};

// SMALL SPONSOR TILES USED ON 2 Pages
export const SponsorTiles = ({ img, text, alt }: sponsorItems) => {
  return (
    <div className="flex flex-col p-[1vh]">
      <Image
        src={img || "/imgs/sponsorTile.png"}
        alt={alt || "White circle containing a sponsor logo"}
        width={500}
        height={500}
        className="size-[10vw],[15.5rem]"
      />
      {text &&
      <text className="text-paragraph font-bold pt-[0.463rem] md:text-1 text-center">
        {text}
      </text>}
    </div>
  );
};

// SPONSOR SHOWCASE COMPONENTS
export const SponsorShowcaseRibbons = ({
  title,
  text,
  img,
  alt,
  subtext,
}: sponsorItems) => {
  return (
    <div className="md:max-w-[50vw] flex flex-col space-y-[3vh]">
      <div className="text-header4 text-red">{title}</div>
      <Image
        src={img || "/imgs/Downtown-Vancouver.png"}
        alt={alt || "img description"}
        width={432}
        height={83}
      />

      <div className="text-paragraph">
        {(text || "").split("\n").map((paragraph, index) => (
          <p key={index} className="pb-[5vh]">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
};

export const DiamondSponsor = ({ img, alt, text }: sponsorItems) => {
  return (
    <div>
      <div className="text-header3 text-red">
        <text>{text}</text>
      </div>
      <div className="md:max-w-[30vw] pt-8">
        <Image
          src={img || "/imgs/silverSponsorLogo.png"}
          alt={alt || "Logo"}
          width={541}
          height={335}
        />
      </div>
    </div>
  );
};

export const SilverSponsor = ({
  title,
  img,
  alt,
  text,
  subtext,
}: sponsorItems) => {
  return (
    <div className="flex flex-col ">
      <div className="text-header3 text-red">
        <text>{title}</text>
      </div>
      <div className="flex items-center justify-center h-[20vh] md:h-[30vh]">
        <Image
          src={img || "/imgs/silverSponsorLogo.png"}
          alt={alt || "Logo"}
          width={541}
          height={335}
        />
      </div>
      <text className="font-bold py-[5vh]">{text}</text>
      <text>{subtext}</text>
    </div>
  );
};

export const TechSponsor = ({
  img,
  logo,
  title,
  subtext,
  text,
  alt,
}: sponsorItems) => {
  return (
    <div className="flex flex-col h-full md:flex-row bg-sectionBlack gap-8 px-7 py-[10vh] lg:p-20">
      <div className="flex justify-center items-center ">
        <Image
          src={img || "/imgs/sponsorShowcase/teamMicrosoft.png"}
          alt={alt || "Group of people hugging with the text Join. above them"}
          width={615}
          height={594}
          className="xl:rounded-2xl rounded-xl"
        />
      </div>
      <div className=" text-white md:max-w-[45vw]  flex flex-col mx-auto">
        <div className="text-header4 py-4">{title}</div>
        <Image
          src={logo || "/imgs/sponsorShowcase/microsoft.png"}
          alt={alt || "Microsoft logo with logotype"}
          width={376}
          height={74}
        />

        <div className="font-bold pt-4">{subtext}</div>
        <p className="text-paragraph pt-2 ">{text}</p>
      </div>
    </div>
  );
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
          <NewLineText2>{text}</NewLineText2>
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
