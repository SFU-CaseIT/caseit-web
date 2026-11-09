"use client";

import { useFormStatus } from "react-dom";
import { LoadingSpinner } from "@/components/animations/LoadingSpinner";

export function SignInSubmitButton() {
  const { pending } = useFormStatus();

  return pending ? (
    <div className="mt-8 flex min-h-11 items-center justify-center">
      <LoadingSpinner label="Signing in..." light />
    </div>
  ) : (
    <button className="mt-8 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-white px-5 py-3 font-semibold text-black transition-colors hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" type="submit">
      Sign in
    </button>
  );
}
