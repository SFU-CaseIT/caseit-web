import { signIn } from "./actions";

// LOGIN PAGE

type AdminLoginPageProps = {
  searchParams?: { error?: string };
};

export default function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl translate-y-[30px] items-center px-6 py-20 md:translate-y-[35px] lg:translate-y-[40px]">
      <form
        action={signIn}
        className="w-full rounded-2xl bg-greyDark p-8 text-Black shadow-xl"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red">CaseIT</p>
        <h1 className="mt-3 text-header1">Admin sign in</h1>

        {searchParams?.error && (
          <p className="mt-5 rounded-md bg-red px-4 py-3 text-sm text-white" role="alert">
            {searchParams.error}
          </p>
        )}

        <label className="mt-7 block text-sm font-semibold" htmlFor="email">
          Email address
        </label>
        <input
          className="mt-2 w-full rounded-md px-3 py-2 text-black"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />

        <label className="mt-5 block text-sm font-semibold" htmlFor="password">
          Password
        </label>
        <input
          className="mt-2 w-full rounded-md px-3 py-2 text-black"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />

        <button className="mt-8 w-full rounded-md bg-pivotBlue px-5 py-3 font-semibold" type="submit">
          Sign in
        </button>
      </form>
    </main>
  );
}
