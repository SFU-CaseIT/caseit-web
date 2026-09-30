import { Metadata } from "next";
import Image from "next/image";
import chair from "@/public/imgs/chair/2025/caseitChair.jpg";
import signature from "@/public/imgs/chair/2025/chairSignature.png";
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
      <h2 className="font-semibold text-4xl lg:text-[4rem] tracking-tight leading-none mb-16">
        {chairs.chairText.header}
      </h2>

      <div className="flex flex-col-reverse lg:space-x-[5vw] lg:flex-row gap-8">
        {/* Text Content */}
        <div className="text-pretty ">
          <div>{chairs.chairContent.paragraph}</div>
          <div mb-4>
            <Image className="w-48" src={signature} alt="chair signature" />
            {chairs.chairContent.signature}
          </div>
        </div>

        {/* Image */}
        <div className="lg:max-w-[33vw]">
          <Image
            className=" rounded-[1rem]"
            src={chair}
            alt="portrait of CaseIT 2025 Chair"
          />
        </div>
      </div>

      <div className="w-full flex justify-center items-center py-[10vh]">
        <RoundedButton
          text="Return to CaseIT 2025 Page"
          link="/2025"
          variant="red"
        />
      </div>
    </main>
  );
}
