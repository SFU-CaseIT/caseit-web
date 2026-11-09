"use client";

import { useFormStatus } from "react-dom";
import { LoadingSpinner } from "@/components/animations/LoadingSpinner";

export function SignOutSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="admin-button admin-button-primary inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold disabled:cursor-wait"
      disabled={pending}
      onClick={() => window.dispatchEvent(new Event("caseit-admin-signout"))}
      type="submit"
    >
      {pending ? <LoadingSpinner label="Signing out..." /> : "Sign out"}
    </button>
  );
}
