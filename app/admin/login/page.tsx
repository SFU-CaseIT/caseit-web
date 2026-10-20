import { signIn } from "./actions";
import { TextBox } from "@/components/TextBox";
import { SignInSubmitButton } from "@/components/admin/SignInSubmitButton";

// LOGIN PAGE

type AdminLoginPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl translate-y-[30px] items-center px-6 py-20 md:translate-y-[35px] lg:translate-y-[40px]">
      <form
        action={signIn}
        className="w-full rounded-2xl bg-greyDark p-8 text-Black shadow-xl"
      >
        <h1 className="mt-3 text-header1">Exec Sign In</h1>

        {params?.error && (
          <p className="mt-5 rounded-md bg-red px-4 py-3 text-sm text-white" role="alert">
            {params.error}
          </p>
        )}

        <div className="mt-7">
          <TextBox
            autoComplete="email"
            id="email"
            label="Email address"
            name="email"
            type="email"
            required
          />
        </div>

        <div className="mt-5">
          <TextBox
            autoComplete="current-password"
            id="password"
            label="Password"
            name="password"
            type="password"
            required
          />
        </div>

        <SignInSubmitButton />
      </form>
    </main>
  );
}
