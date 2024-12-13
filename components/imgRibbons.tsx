"use client";
import { ImgLeft, ImgRight } from "@/components/img";
import React, { useState } from "react";
import Image from "next/image";

type ribbonItems = {
  img: string;
  alt: string;
  children: React.ReactNode;
  hoverImg?: string;
};

export const ImgRibbonLeft = ({ img, alt, children }: ribbonItems) => {
  return (
    <div className="md:flex md:space-x-[5vw]">
      <ImgLeft
        img={img}
        stylingClasses="w-[90vw] md:w-[70vw] h-auto xl:rounded-2xl rounded-xl"
        alt={alt || "img description"}
      />
      <div className=" px-7 md:px-[5vw] pr-[5vw] md:w-[70vw] flex flex-col items-start justify-center">
        {" "}
        {children}
      </div>
    </div>
  );
};

export const ImgRibbonRight = ({ img, alt, children }: ribbonItems) => {
  return (
    <div className="flex flex-col-reverse md:flex-row md:space-x-[5vw]">
      {" "}
      <div className=" px-7 md:px-[5vw] pr-[5vw] md:w-[70vw] flex flex-col items-start justify-center">
        {" "}
        {children}
      </div>
      <ImgRight
        img={img}
        stylingClasses="w-[90vw] md:w-[70vw] h-auto xl:rounded-2xl rounded-xl"
        alt={alt || "img description"}
      />
    </div>
  );
};

// This version has 2 images that tranistion to teach other
export const ImgRibbonLeftOC = ({
  hoverImg,
  img,
  alt,
  children,
}: ribbonItems) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    if (hoverImg) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (hoverImg) setIsHovered(false);
  };

  return (
    <div className="md:flex md:space-x-[5vw] p-7 ">
      {/* Image Container */}
      <div
        className="relative w-[90vw] md:w-[70vw] "
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Border Decoration */}
        <div className="absolute inset-0 md:border-2 md:border-redDark md:rounded-2xl md:transform md:-translate-x-36 md:-z-10"></div>

        {/* Original Image */}
        <Image
          src={img || "/imgs/Downtown-Vancouver.png"}
          alt={alt || "Image description"}
          width={1002}
          height={503}
          className={` p-7 absolute xl:rounded-2xl rounded-xl transition-opacity duration-500   ${
            isHovered ? "opacity-0" : "opacity-100"
          }`}
        />

        {/* Hover Image */}
        {hoverImg && (
          <Image
            src={hoverImg}
            alt={`${alt || "Hover image description"}`}
            width={1002}
            height={503}
            className={`absolute xl:rounded-2xl rounded-xl transition-opacity duration-500  ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
          />
        )}
      </div>

      {/* Text Content */}
      <div className=" px-7 md:px-[5vw] pr-[5vw] md:w-[70vw] flex flex-col items-start justify-center">
        {" "}
        {children}
      </div>
    </div>
  );
};
