import { signOut } from "./actions";
import AdminWorkbookEditor from "@/components/admin/AdminWorkbookEditor";

// DEFAULT /ADMIN PAGE (PROTECTED)

export default function AdminDashboard() {
  return (
    <main className="mx-auto min-h-[60vh] max-w-6xl px-4 pb-10 pt-20 sm:px-6 sm:pt-24 lg:px-8 lg:pt-24">
      <header className="flex flex-wrap items-center justify-between gap-5 border-b border-black/10 pb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-redDark">CaseIT 2027</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-black sm:text-4xl">Executive workspace</h1>
        </div>
        <form action={signOut}>
          <button
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-black/20 bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:border-black/40 hover:bg-black/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
          >
            Sign out
          </button>
        </form>
      </header>
      <AdminWorkbookEditor />
    </main>
  );
}
