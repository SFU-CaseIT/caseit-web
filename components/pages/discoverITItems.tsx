"use client";
import { BoldedText } from "../text";
import Image from "next/image";
import type { ReactNode } from "react";

type discoverITItems = {
  title?: string | ReactNode;
  text?: string;
  paragraph?: ReactNode;
  img?: string;
  subtext?: string;
  children?: ReactNode;
};

export const Bento = ({ children }: discoverITItems) => {
  return (
    <div className="flex flex-col p-7 bg-greyDark rounded-2xl drop-shadow-[0_0_5px_rgba(0,0,0,0.2)]">
      {children}
    </div>
  );
};

export const BentoText = ({ title, text }: discoverITItems) => {
  return (
    <div>
      <div className="text-header2"></div>
      <h1 className="text-header2 pb-4">
        {title}
        <span className="text-red">IT</span>
      </h1>
      <BoldedText text={text} />
    </div>
  );
};

export const TourBento = ({
  title,
  text,
  img,
  subtext,
  children,
}: discoverITItems) => {
  return (
    <div className="flex flex-col  lg:flex-row lg:space-x-20 p-7 bg-greyDark rounded-2xl drop-shadow-[0_0_5px_rgba(0,0,0,0.2)]">
      <div className=" flex flex-col space-y-3 pb-12 lg:pb-0">
        <div className="text-[18px] font-bold ">{subtext}</div>
        <div className="text-red text-header2">{title}</div>
        <div className="text-paragraph">{text}</div>
        <div className="text-paragraph">{children}</div>
      </div>
      <div className="justify-center w-full flex">
        <Image
          src={img || "/imgs/Downtown-Vancouver.png"}
          alt="its an image"
          width={606} // Original aspect ratio width
          height={908} // Original aspect ratio height
          className="rounded-xl w-full lg:w-auto md:max-w-[60vw] lg:max-w-[25vw]"
        />
      </div>
    </div>
  );
};

export const CaptureITBanner = ({ title, paragraph }: discoverITItems) => {
  return (
    <div>
      <div className="text-header2">{title}</div>
      <div className="pt-[3%]">{paragraph}</div>
    </div>
  );
};

export const CaptureITCard = ({ title, text }: discoverITItems) => {
  return (
    <div
      className={
        "flex flex-col p-4 rounded-2xl shadow-[0px_0px_9px_1.5px_rgba(0,0,0,0.3)] bg-white md:min-w-[350px] mt-6 min-h-[16vh]"
      }
    >
      <div className="text-red text-paragraph font-bold">{title}</div>
      <p className="pt-1 text-paragraph">{text}</p>
    </div>
  );
};

export const CaptureITPosts = ({ img }: discoverITItems) => {
  return (
    <div className={"flex justify-center lg:pb-[3vh] pb-[7vh]"}>
      <Image
        src={img || "/imgs/story1"}
        alt="caseitsfu's instagram story"
        width={389} // Original aspect ratio width
        height={690.916} // Original aspect ratio height
        // className="rounded-xl  max-w-[45vw] lg:max-w-[25vw]"
      />
    </div>
  );
};

export const OverviewMap = () => {
  return (
    <div>
      {/* Simply an imported Google map :)  */}
      <iframe
        src="https://www.google.com/maps/d/embed?mid=1b6xiebGCg5bnW6dZBfN-u9xAZFV-QNY&ehbc=2E312F&noprof=1"
        loading="lazy"
        allowFullScreen
        style={{ width: "100%", height: "85vh" }}
        title="Overview Map"
      ></iframe>
    </div>
  );
};
