import { ClarityAnalytics } from "@/components/ClarityAnalytics";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <ClarityAnalytics />
      {children}
    </>
  );
}