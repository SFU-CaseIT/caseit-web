import Image, { StaticImageData } from "next/image";

// anything to do with ImageResponse, like sizing and formating for other components too

type imgItems = {
  img?: string | StaticImageData;
  stylingClasses?: string;
  alt?: string;
  title?: string;
  text?: string;
  subtext?: string;
  children?: React.ReactNode;
};

export const BgImgCenter = ({ img, children }: imgItems) => {
  return (
    <section className="relative h-screen w-full">
      <Image
        src={img || "/imgs/banners/Downtown-Vancouver.png"}
        alt="Downtown Vancouver"
        className=" object-cover"
        layout="fill" // Ensures the image fills the container
        objectFit="cover"
      />
      <div className="absolute inset-0 flex flex-col justify-center items-center text-center mx-auto max-w-[90vw]">
        {children}
      </div>
    </section>
  );
};
export const BgImgLeft = ({ children }: imgItems) => {
  return (
    <section className="relative mb-[10vh]  h-screen w-full">
      <Image
        src="/imgs/banners/sponsor_banner.png" // Fixed image under the text
        alt="Downtown Vancouver"
        className=" object-cover"
        layout="fill" // Ensures the image fills the container
        objectFit="cover"
      />
      <div className="absolute inset-0 flex flex-col justify-center">
        {children}
      </div>
    </section>
  );
};

export const ImgLeft = ({ img, stylingClasses, alt }: imgItems) => {
  return (
    <div className="relative p-7 ">
      <div className="absolute inset-0 md:border-2 md:border-redDark md:rounded-2xl md:transform md:-translate-x-36 md:-z-10"></div>
      <Image
        src={img || "/imgs/Downtown-Vancouver.png"}
        alt={alt || "img description"}
        width={1002} // Original aspect ratio width
        height={503} // Original aspect ratio height
        className={stylingClasses}
      />
    </div>
  );
};
export const ImgRight = ({ img, stylingClasses, alt }: imgItems) => {
  return (
    <div className="relative p-7 overflow-hidden">
      <div className="absolute inset-0 md:border-2 md:border-redDark md:rounded-2xl md:transform md:translate-x-20 md:translate-x-36 md:-z-10"></div>
      <Image
        src={img || "/imgs/Downtown-Vancouver.png"}
        alt={alt || "img description"}
        width={1002} // Original aspect ratio width
        height={503} // Original aspect ratio height
        className={stylingClasses}
      />
    </div>
  );
};

export const IconImg = ({
  img,
  stylingClasses,
  title,
  text,
  alt,
}: imgItems) => {
  return (
    <div className="flex flex-col md:flex-row md:space-x-[3vw]">
      <Image
        src={img || "/imgs/target.svg"}
        alt={alt || "img description"}
        width={175}
        height={175}
        className={`${stylingClasses} w-[8rem] md:w-[10vw] h-auto hidden md:block`}
      />
      <div>
        <div className="text-header2 md:text-header4 text-red"> {title} </div>
        <p className="md:max-w-[30vw] xl:max-w-[25vw]">{text}</p>
      </div>
    </div>
  );
};
