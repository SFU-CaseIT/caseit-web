"use client";

import { useFormStatus } from "react-dom";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export function SignOutSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-black/20 bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:border-black/40 hover:bg-black/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-wait disabled:opacity-70"
      disabled={pending}
      onClick={() => window.dispatchEvent(new Event("caseit-admin-signout"))}
      type="submit"
    >
      {pending ? <LoadingSpinner label="Signing out..." /> : "Sign out"}
    </button>
  );
}
