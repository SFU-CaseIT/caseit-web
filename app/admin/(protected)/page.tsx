import { signOut } from "./actions";
import AdminWorkbookEditor from "@/components/admin/AdminWorkbookEditor";

// DEFAULT /ADMIN PAGE (PROTECTED)

export default function AdminDashboard() {
  return (
    <main className="mx-auto min-h-[60vh] max-w-[1500px] px-4 pb-10 pt-20 sm:px-6 sm:pt-24 lg:px-8 lg:pt-24">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-header1">CaseIT admin</h1>
          <p className="mt-2 text-sm text-black/65">Internal tools for the 2027 executive team.</p>
        </div>
        <form action={signOut}>
          <button className="min-h-11 border-2 border-black px-4 py-2 text-sm font-semibold hover:bg-black hover:text-white" type="submit">
            Sign out
          </button>
        </form>
      </div>
      <AdminWorkbookEditor />
    </main>
  );
}
