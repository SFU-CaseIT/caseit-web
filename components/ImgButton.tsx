import Image from "next/image";
import Link from "next/link";
import { StaticImageData } from "next/image";

type buttonItems = {
  img?: string | StaticImageData;
  alt?: string;
  link: string;
  text?: string;
  subtext?: string;
};


export const ImgButton = ({ img, alt, text, link }: buttonItems) => {
  return (
    <div className="relative h-full">
      {/* Top line */}

      <Link
        href={link}
        className="relative  group focus:shadow-[0_0_15px_rgba(197,52,52,0.8)] focus:outline-red focus:outline focus:outline-[2px] focus:rounded-xl"
      >
        <Image
          src={img || "/svgs/CaseIT_Black.svg"}
          alt={alt || "image description"}

          className="h-full w-full brightness-75 object-cover object-center group-hover:brightness-100 duration-300 xl:rounded-2xl rounded-xl group-hover:outline group-hover:outline-[4px] group-hover:outline-red"
        />

        <div className="absolute inset-0 flex items-end pl-5 pb-5 z-10 max-w-[95%]">
          <div className="text-white">
            <p className="font-bold text-base sm:text-2xl ">{text}</p>
          </div>
        </div>
      </Link>
    </div>
  );
};

