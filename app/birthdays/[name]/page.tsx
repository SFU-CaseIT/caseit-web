import type { Metadata } from "next";
import { notFound } from "next/navigation";

type BirthdayPageProps = {
  params: { name: string };
};

// Cache each birthday URL for five minutes, then refresh it from the database.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Birthdays | CaseIT",
  robots: { index: false, follow: false },
};

export default async function BirthdayPage({ params }: BirthdayPageProps) {
  const uid = params.name.trim();

  // Keep invalid route values from being treated as database identifiers.
  if (!uid || uid.length > 128) {
    notFound();
  }

  // Replace this with a server-side database lookup keyed by `uid`, for example:
  // const recipient = await db.birthdayRecipient.findUnique({ where: { uid } });
  // if (!recipient) notFound();
  // const displayName = recipient.name;
  // Do not perform this lookup in a client component or expose database credentials.
  const displayName = uid.replace(/[-_]+/g, " ");

  return (
    <main className="min-h-[70vh] bg-white px-6 py-24 md:px-12">
      <section className="mx-auto flex max-w-3xl flex-col items-center rounded-3xl bg-pivotBlue px-8 py-16 text-center text-white shadow-xl md:px-16">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-red">
          From CaseIT
        </p>
        <h1 className="font-[acid] text-5xl leading-none md:text-7xl">
          Happy Birthday!
        </h1>
        <p className="mt-6 text-header2 capitalize">{displayName}</p>
        <p className="mt-6 max-w-xl text-lg">
          Wishing you a wonderful year ahead from the CaseIT team.
        </p>
      </section>
    </main>
  );
}
