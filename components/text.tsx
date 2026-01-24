"use client";
import Image from "next/image";
import { ReactNode } from "react";

// Anything that edits text is HeroSection, like pragraph styling or font bolding
type TextItems = {
  title?: string;
  text?: string;
  subtext?: string;
  dotText?: ReactNode;
  stylingClasses?: string;
};

type MembersText = {
  members: { available?: string; missing?: string };
} & TextItems



export const TextDot = ({ dotText }: TextItems) => {
  return (
    <div className="flex items-baseline">
      <div>{dotText}</div>
      <span className="ml-1 w-2">
        <Image src="/svgs/redDot.svg" alt="red dot" width="8" height="8" />
      </span>
    </div>
  );
};

export const OCText = ({ title, text, subtext, members }: MembersText) => {
  return (
    <div className="md:pl-10">
      <div className="text-header3 md:text-header2 leading-[2.5rem]">
        {title}
      </div>
      <div className="md:max-w-[50vw] pb-[2vh] pr-[3vw]">
        <div className="text-paragraph">{text}</div>
      </div>
      {members && typeof members === 'object' ? (
        <div>
          <p className="font-bold">
            Left to right: {members.available}
          </p>
          {members.missing && (
            <p className="text-sm font-bold mt-1">
              Missing: {members.missing}
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

export const RecapText = ({ title, text, subtext }: TextItems) => {
  return (
    <div className="md:pl-10 flex flex-col space-y-3">
      {/*This might be everyone instead of just available */}
      <div className="text-red text-header2">{subtext}</div>
      <div className="text-header4">{title}</div>
      <div className="md:max-w-[50vw] pb-[2vh] ">
        <div className="text-paragraph">{text}</div>
      </div>
    </div>
  );
};

export const WinnersText = ({ title, subtext }: TextItems) => {
  return (
    <div className="md:pl-10 flex flex-col space-y-3 leading-none">
      {/*This might be everyone instead of just available */}
      <div className="text-red text-paragraph font-bold">{subtext}</div>
      <div className="md:max-w-[50vw] pb-[2vh] ">
        <div className="text-header2">{title}</div>
      </div>
    </div>
  );
};

export const BoldedText = ({ text }: TextItems) => {
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

export const NewLineText = ({ text }: TextItems) => {
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
