"use client";
import Image from "next/image";
import { ReactNode } from "react";

// Anything that edits text is HeroSection, like pragraph styling or font bolding
type textItems = {
  title?: string;
  text?: string;
  subtext: { available?: string; missing?: string };
  dotText?: ReactNode;
  stylingClasses?: string;
};

export const TextDot = ({ dotText }: textItems) => {
  return (
    <div className="flex items-baseline">
      <div>{dotText}</div>
      <span className="ml-1 w-2">
        <Image src="/svgs/redDot.svg" alt="red dot" width="8" height="8" />
      </span>
    </div>
  );
};

export const OCText = ({ title, text, subtext }: textItems) => {
  return (
    <div className="md:pl-10">
      <div className="text-header3 md:text-header2 leading-[2.5rem]">
        {title}
      </div>
      <div className="md:max-w-[50vw] pb-[2vh] pr-[3vw]">
        <div className="text-paragraph">{text}</div>
      </div>
      {subtext && typeof subtext === 'object' ? (
        <div>
          <p className="font-bold">
            Left to right: {subtext.available}
          </p>
          {subtext.missing && (
            <p className="text-sm font-bold mt-1">
              Missing: {subtext.missing}
            </p>
          )}
        </div>
      ) : (
        <p>
          <strong>{subtext}</strong>
        </p>
      )}
    </div>
  );
};

export const RecapText = ({ title, text, subtext }: textItems) => {
  return (
    <div className="md:pl-10 flex flex-col space-y-3">
      {/*This might be everyone instead of just available */}
      <div className="text-red text-header2">{subtext.available}</div>
      <div className="text-header4">{title}</div>
      <div className="md:max-w-[50vw] pb-[2vh] ">
        <div className="text-paragraph">{text}</div>
      </div>
    </div>
  );
};

export const WinnersText = ({ title, subtext }: textItems) => {
  return (
    <div className="md:pl-10 flex flex-col space-y-3 leading-none">
      {/*This might be everyone instead of just available */}
      <div className="text-red text-paragraph font-bold">{subtext.available}</div>
      <div className="md:max-w-[50vw] pb-[2vh] ">
        <div className="text-header2">{title}</div>
      </div>
    </div>
  );
};

export const BoldedText = ({ text }: textItems) => {
  // Split the text using `\b` as the delimiter
  const segments = (text || "").split("\b"); // Using regex to capture \b as the delimiter

  return (
    <div>
      {segments.map((segment, index) =>
        index % 2 === 0 ? ( // Even index: normal text
          <span key={index}>{segment}</span>
        ) : (
          // Odd index: bolded text
          <span key={index} className="font-bold">
            {segment}
          </span>
        )
      )}
    </div>
  );
};

export const NewLineText = ({ text }: textItems) => {
  return (
    <div>
      {(text || "").split("\n").map((paragraph, index) => (
        <p key={index} className="pb-[2vh]">
          {paragraph}
        </p>
      ))}
    </div>
  );
};

interface NewLineTextProps {
  children: string;
}

export const NewLineText2: React.FC<NewLineTextProps> = ({ children }) => {
  return (
    <div>
      {(children || "").split("\n").map((paragraph, index) => (
        <p key={index} className="pb-[2vh]">
          {paragraph}
        </p>
      ))}
    </div>
  );
};
