import { ClarityAnalytics } from "@/components/ClarityAnalytics";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <ClarityAnalytics />
      <Header />
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