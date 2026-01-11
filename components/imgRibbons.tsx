"use client";
import { ImgLeft, ImgRight } from "@/components/img";
import React, { useState } from "react";

// Merges a few components into reusable image and info components

type ribbonItems = {
  img: string;
  alt: string;
  children: React.ReactNode;
  hoverImg: string;
  hoverAlt: string;
};

// Image on the left while the text or children elements are on the right
export const ImgRibbonLeft = ({
  hoverImg,
  img,
  alt,
  hoverAlt,
  children,
}: ribbonItems) => {
  const [isHovered, setIsHovered] = useState(false);
  const handleMouseEnter = () => {
    if (hoverImg) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (hoverImg) {
      setIsHovered(false);
    }
  };
  return (
    <div className="md:flex md:space-x-[5vw] md:items-center">
      <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <ImgLeft
          img={(isHovered && hoverImg) ? hoverImg : img}
          stylingClasses="w-[90vw] md:w-[70vw] h-auto xl:rounded-2xl rounded-xl"
          alt={(isHovered && hoverAlt) ? hoverAlt : alt}
        />{" "}
      </div>
      <div className=" px-7 md:px-[5vw] pr-[5vw] md:w-[70vw] flex flex-col items-start justify-center">
        {children}
      </div>
    </div>
  );
};

// Image on the right while the text or children elements are on the left
export const ImgRibbonRight = ({
  hoverImg,
  img,
  alt,
  hoverAlt,
  children,
}: ribbonItems) => {
  const [isHovered, setIsHovered] = useState(false);
  const handleMouseEnter = () => {
    if (hoverImg) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (hoverImg) {
      setIsHovered(false);
    }
  };
  return (
    <div className="flex flex-col-reverse md:flex-row md:space-x-[5vw]  md:items-center ">
      {" "}
      <div className="md:px-[5vw] md:w-[70vw] flex flex-col items-start justify-center px-7">
        {children}
      </div>
      <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <ImgRight
          img={isHovered && hoverImg ? hoverImg : img}
          stylingClasses="w-[90vw] md:w-[70vw] h-auto xl:rounded-2xl rounded-xl"
          alt={isHovered && hoverAlt ? hoverAlt : alt}
        />{" "}
      </div>
    </div>
  );
};
