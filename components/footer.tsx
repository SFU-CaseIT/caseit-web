import { NavList } from "./navigation/NavList";
import CaseitLogoWhite from "@/public/svgs/caseit/CaseitLogoWhite";
import { allLinks, socialLinks } from "@/content/footer_content";
import Link from "next/link";

export const Footer = () => {
  return (
    <div className="bg-footerRed px-6 md:px-12 xl:px-20 py-14 lg:pt-24 flex flex-col gap-8 lg:gap-[10vw] 2xl:gap-[20vw] lg:flex-row text-white text-[0.875rem] lg:text-[1rem] ">
      <div className=" max-w-[87px] lg:max-w-[165px]">
        <CaseitLogoWhite className="w-full" />
      </div>
      <nav className="flex flex-col w-full">
        <div className="flex flex-col  gap-12  ">
          <div className="grid grid-cols-2 gap-y-12 md:gap-8 justify-between sm:flex  ">
            {allLinks.map((link, index) => (
              <div key={index}>
                <p className="font-bold mb-6">{link.title}</p>
                <NavList
                  listClassName="flex flex-col gap-2"
                  linkClassName="text-white/60 hover:text-white duration-200 "
                  linkArray={link.links}
                />
              </div>
            ))}
          </div>
          <div>
            <p className="font-bold mb-6">Follow us!</p>
            <NavList
              listClassName="flex flex-row gap-2"
              linkClassName="flex opacity-60 hover:opacity-100 duration-300 "
              linkArray={socialLinks}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 text-[0.75rem] md:text-[1rem]  mt-24 border-t pt-4 border-t-white text-white/60">
          <span>CaseIT © 2020-2026 </span>
          <span className="hidden sm:flex">| </span>
          <Link
            className="hover:text-white duration-200"
            href={"https://www.sfu.ca/contact/terms-conditions/privacy.html"}
          >
            Privacy Policy
          </Link>
          <span className="hidden sm:flex">| </span>
          <Link
            className="hover:text-white duration-200"
            href={
              "https://www.sfu.ca/communicators-toolkit/brand/guidelines/writing/editorial-style-guide/language-grammar/territorial-acknowledgements.html"
            }
          >
            Traditional Territories Acknowledgement
          </Link>
        </div>
      </nav>
    </div>
  );
};
