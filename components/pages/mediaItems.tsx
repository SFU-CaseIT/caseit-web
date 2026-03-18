"use client";
import Image from "next/image";
import Link from "next/link";

type galleryItems = {
  link: string;
  title: string;
  subtext: string;
  img: string;
  state?: string;
};

export const GalleryCards = ({
  title,
  subtext,
  img,
  link,
  state,
}: galleryItems) => {
  return (
    <Link href={link || "dummy"} className="flex flex-col">
      <div className="rounded-2xl border-borderGrey focus:border-[#99444B] focus:border-4 hover:shadow-[0_0_15px_rgba(197,52,52,0.3)] transition-all border-2 p-1">
        <div>
          <Image
            src={img || "/imgs/mediaGallery/mediaGallery.png"}
            alt="Gallery photo"
            width={472}
            height={267}
            className="mx-auto w-full rounded-xl border aspect-[472/267] object-cover"
          />
        </div>
        <div className="text-center py-4">
          <div
            className={`text-paragraph font-bold ${
              state === "disabled" ? "text-[#C7C5C5]" : ""
            }`}
          >
            {title}
          </div>
          <div
            className={`text-paragraph ${
              state === "disabled" ? "text-[#C7C5C5]" : " text-greyLight"
            }`}
          >
            {subtext}
          </div>
        </div>
      </div>
    </Link>
  );
};
