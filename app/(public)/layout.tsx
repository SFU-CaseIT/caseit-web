import { ClarityAnalytics } from "@/components/ClarityAnalytics";
import { NavBar } from "@/components/navigation/nav";
import { Footer } from "@/components/footer";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <ClarityAnalytics />
      <NavBar />
      <div
        className="transition-all duration-[700ms] origin-[center_458px] ease-[cubic-bezier(.16,1,.3,1)] "
        id="nav-animation"
      >
        {children}
      </div>
      <Footer />
    </>
  );
}