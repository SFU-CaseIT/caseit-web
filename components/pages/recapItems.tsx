"use client";
import Image from "next/image";

type recapItems = {
  text?: string;
  title?: string;
  subtext?: string;
  img?: string;
  alt?: string;
};

export const RecapCards = ({ title, subtext, img, alt }: recapItems) => {
  return (
    <div className="flex flex-col md:max-w-[30vw] ">
      <div>
        <div>
          <Image
            src={img || "/imgs/mediaGallery/mediaGallery.png"}
            alt={alt || "Award winners"}
            width={513}
            height={370}
            className="mx-auto w-full h-[250px] object-cover rounded-2xl"
          />
        </div>
        <div className="text-center py-4">
          <div className="text-header3">{title}</div>
          <div className="text-paragraph">{subtext}</div>
        </div>
      </div>
    </div>
  );
};
