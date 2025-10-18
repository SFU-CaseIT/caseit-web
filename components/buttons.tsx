"use client";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { ArrowIcon } from "@/public/svgs/arrows/arrow";

// CLSX library was used here to create different variations of imgButtons
// Make sure you npm install!
// Additional variations can be applied but this should cover almost all states

type buttonItems = {
  img?: string;
  alt?: string;
  link: string;
  text?: string;
  subtext?: string;
  
};
type ButtonProps = buttonItems & {
  state?: "default" | "hover" | "focus" | "disabled";
};
type RoundedButtonProps = ButtonProps & {
  variant?: "red" | "outline" | "black";
};
type SquareButtonProps = ButtonProps & {
  variant?: "white" | "black";
};

export const ImgButton = ({ img, alt, text, link }: buttonItems) => {
  return (
    <div className="relative">
      {/* Top line */}

      <Link
        href={link}
        className="relative block group focus:shadow-[0_0_15px_rgba(197,52,52,0.8)] focus:outline-red focus:outline focus:outline-[2px] focus:rounded-xl"
      >
        <Image
          src={img || "/svgs/CaseIT_Black.svg"}
          alt={alt || "image description"}
          width={645}
          height={415}
          className="w-[90vw] md:w-[50vw] lg:w-[40vw] xl:w-[30vw] h-auto brightness-75 group-hover:brightness-100 duration-300 xl:rounded-2xl rounded-xl group-hover:outline group-hover:outline-[4px] group-hover:outline-red"
        />

        <div className="absolute inset-0 flex items-end pl-5 pb-5 z-10 max-w-[95%]">
          <div className="text-white">
            <p className="font-bold text-base sm:text-lg ">{text}</p>
          </div>
        </div>
      </Link>
    </div>
  );
};

export const RoundedButton = ({
  text,

  link,
  variant = "red",
  state = "default",
}: RoundedButtonProps) => {
  return (
    <Link href={link}>
      <button
        className={clsx(
          "inline-flex items-center rounded-full px-5 py-1.5 md:py-2 text-[15px]  md:text-[17px] transition-colors",
          {
            // Variants
            "bg-redDark text-white": variant === "red" && state === "default",
            "bg-buttonBlackOff text-white":
              variant === "black" && state === "default",
            "bg-transparent text-black border border-black border-2 font-bold":
              variant === "outline" && state === "default",

            // Hover states
            "hover:bg-buttonRedDark": variant === "red" && state !== "disabled",
            "hover:bg-black hover:text-white":
              (variant === "black" || variant === "outline") &&
              state !== "disabled",

            // Focus state applied to the button
            "focus:border focus:border-buttonRedDark focus:text-buttonRedDark focus:bg-transparent":
              variant === "red" && state === "focus",
            "focus:border focus:border-buttonBlackHovered focus:text-buttonBlackHovered focus:bg-transparent":
              variant === "black" && state === "focus",
            "focus:border focus:border-none focus:text-black focus:bg-buttonBlackHovered":
              variant === "outline" && state === "focus",

            // Ghost buttons
            "bg-buttonGreyDisabled border border-buttonGreyDisabled text-buttonGreyDisabledText":
              (variant === "black" ||
                variant === "outline" ||
                variant === "red") &&
              state == "disabled",

            // Disabled state
            "cursor-not-allowed": state === "disabled",
          }
        )}
      >
        {text}
      </button>
    </Link>
  );
};

export const SquareButton = ({
  text,
  subtext,
  link,
  variant = "white",
  state = "default",
}: SquareButtonProps) => {
  return (
    <Link href={link}>
      <button
        className={clsx(
          "flex flex-col text-left rounded-lg px-5 py-2 text-[17px] transition-colors",
          "md:text-base",
          {
            // Variants
            "bg-transparent text-black border border-black":
              variant === "black" && state === "default",
            "bg-transparent text-white border border-white":
              variant === "white" && state === "default",

            // Hover states
            "hover:bg-black hover:text-white":
              variant === "black" && state !== "disabled",
            "hover:bg-white hover:text-black ":
              variant === "white" && state !== "disabled",

            // Focus state applied to the button
            "focus:text-white focus:bg-buttonBlackOff":
              variant === "black" && state === "focus",
            "focus:text-black focus:bg-buttonGreyDisabled":
              variant === "white" && state === "focus",

            // Ghost buttons
            "bg-buttonGreyDisabled border border-buttonGreyDisabled text-buttonGreyDisabledText":
              (variant === "black" || variant === "white") &&
              state == "disabled",

            // Disabled state
            "cursor-not-allowed": state === "disabled",
          }
        )}
      >
        <p className="font-semibold">{text}</p>
        <p className="text-[1rem]">{subtext}</p>
      </button>
    </Link>
  );
};

export const PivotButton = ({ text, link, state = "default" }: ButtonProps) => {
  return (
    <Link href={link}>
      <button
        className={clsx(
          "inline-flex items-center rounded-full px-4 py-1 text-[17px] transition-colors ",
          "md:text-[15px]",
          {
            // Variants
            "bg-transparent text-white border border-white":
              state === "default",

            // Hover states
            "hover:bg-white hover:text-pivotBlue": state !== "disabled",

            // Focus state applied to the button
            "focus:border focus:border-white focus:text-white focus:bg-transparent":
              state === "focus",

            // Ghost buttons
            "bg-buttonGreyDisabled border border-buttonGreyDisabled text-buttonGreyDisabledText":
              state == "disabled",

            // Disabled state
            "cursor-not-allowed": state === "disabled",
          }
        )}
      >
        {text}{" "}
        {
          <span className="ml-2 ">
            <ArrowIcon stylingClasses="w-3" />
          </span>
        }
      </button>
    </Link>
  );
};

export const ArrowButton = ({ img, alt }: ButtonProps) => {
  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button onClick={handleScrollToTop}>
      <div className="bg-buttonBlack hover:bg-buttonRedDark transition-all p-5 rounded-2xl ">
        <Image
          src={img || "/svgs/arrows/arrowButton.svg"}
          alt={alt || "red button with an arrow pointing up"}
          width={25}
          height={25}
          className="fill-transparent"
        />
      </div>
    </button>
  );
};
