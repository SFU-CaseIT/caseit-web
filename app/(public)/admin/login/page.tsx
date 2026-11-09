import { signIn } from "./actions";
import type { Metadata } from "next";
import { TextBox } from "@/components/TextBox";
import { SignInSubmitButton } from "@/components/admin/SignInSubmitButton";
import FadeIn from "@/components/animations/FadeIn";

// LOGIN PAGE

export const metadata: Metadata = {
  title: "Admin Login",
  description: "Sign in to the CaseIT logistics.",
  robots: {
    index: false,
    follow: false,
  },
};

type AdminLoginPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl translate-y-[30px] items-center px-6 py-15 md:translate-y-[35px] lg:translate-y-[40px]">
      <FadeIn className="w-full">
        <form
          action={signIn}
          className="w-full rounded-2xl bg-black/15 p-8 text-white backdrop-blur-sm"
        >
          <h1 className="text-header1">Sign in</h1>

          {params?.error && (
            <p className="mt-5 rounded-md bg-black/75 px-4 py-3 text-sm text-white" role="alert">
              {params.error}
            </p>
          )}

          <div className="mt-7">
            <TextBox
              autoComplete="email"
              id="email"
              label="Email address"
              light
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
              light
              name="password"
              type="password"
              required
            />
          </div>

          <SignInSubmitButton />
        </form>
      </FadeIn>
    </main>
  );
}
