import type { Metadata } from "next";
import Link from "next/link";
import PublicLayout from "@/app/(public)/layout";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you’re looking for could not be found.",
};

export default function NotFound() {
  return (
    <PublicLayout>
      <main className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16 text-center text-white">
        <div className="rounded-xl bg-black/75 px-6 py-8">
          <h1 className="text-4xl font-bold sm:text-5xl">Page not found</h1>
          <p className="mt-4 text-lg">
            Sorry, we couldn’t find the page you’re looking for.
          </p>
          <Link
            className="mt-8 inline-block rounded-md border border-white px-5 py-3 font-semibold transition-colors hover:bg-white hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            href="/"
          >
            Return home
          </Link>
        </div>
      </main>
    </PublicLayout>
  );
}
