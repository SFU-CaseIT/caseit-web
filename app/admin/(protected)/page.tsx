import { signOut } from "./actions";

// DEFAULT /ADMIN PAGE (PROTECTED)

export default function AdminDashboard() {
  return (
    <main className="mx-auto min-h-[60vh] max-w-3xl translate-y-[30px] px-6 py-20 md:translate-y-[35px] lg:translate-y-[40px]">
      <h1 className="text-header1">CaseIT admin</h1>
      <p className="mt-6">You are signed in with admin access.</p>
      <form action={signOut} className="mt-8">
        <button className="rounded-md bg-pivotBlue px-5 py-3 font-semibold text-white" type="submit">
          Sign out
        </button>
      </form>
    </main>
  );
}
