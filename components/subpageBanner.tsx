"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SubpageBanner({
  link,
  title,
}: {
  link: string;
  title: string;
}) {
  const pathname = usePathname();

  return (
    <Link
      href={link}
      className={`${
        pathname === link ? "underline underline-offset-4 decoration-2" : ""
      }`}
    >
      {title}
    </Link>
  );
}

export const DiscoverITBanner = () => {
  return (
    <div className="space-x-[3rem] flex text-redDark text-[13px] font-semibold mb-[3vh] md:mb-[1vh]">
      <SubpageBanner link="/2026/DiscoverIT/overview" title="OVERVIEW" />
      <SubpageBanner link="/2026/DiscoverIT/Tour" title="TOUR" />
      <SubpageBanner link="/2026/DiscoverIT/CaptureIT" title="CAPTUREIT" />
    </div>
  );
};
