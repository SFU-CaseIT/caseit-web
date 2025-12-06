import { Metadata } from "next";
import Image from "next/image";
import chair from "@/public/imgs/chair/2026/caseitChair.jpg";
import signature from "@/public/imgs/chair/2026/chairSignature.png";
import * as chairs from "@/content/chair_content";
import { RoundedButton } from "@/components/buttons";

export const metadata: Metadata = {
  title: "Chair's Welcome",
  description:
    "With great excitement, we are embarking on another remarkable year of CaseIT",
};

export default function Chair() {
  return (
    <main className="p-7 md:px-16 pt-36 mx-auto md:max-w-[80vw] overflow-hidden">
      <h2 className="font-semibold text-4xl lg:text-[4rem] tracking-tight leading-none mb-10">
        {chairs.chairText.header}
      </h2>

      <div className="flex flex-col gap-8 justify-center items-center xl:flex-row-reverse">
        {/* Image */}
          <Image
            src={chair}
            width={500}
            height={500}
            className=" rounded-2xl object-contain md:w-screen lg:w-[50vw]"
            quality={100}
            alt="portrait of CaseIT 2026 Chair"
          />

        {/* Text Content */}
        <div className="text-pretty ">
          <div className="max-w-[60vw]">{chairs.chairContent.paragraph}</div>
        </div>
      </div>
      <div mb-4>
        <Image className="w-48" src={signature} alt="chair signature" />
        {chairs.chairContent.signature}
      </div>

      <div className="w-full flex justify-center items-center py-[10vh]">
        <RoundedButton
          text="Return to CaseIT 2026 Page"
          link="/2026"
          variant="red"
        />
      </div>
    </main>
  );
}
