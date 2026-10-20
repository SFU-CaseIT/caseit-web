"use client";

import { useFormStatus } from "react-dom";
import { ActionButton } from "@/components/buttons";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export function SignInSubmitButton() {
  const { pending } = useFormStatus();

  return pending ? (
    <div className="mt-8 flex min-h-11 items-center justify-center">
      <LoadingSpinner label="Signing in..." />
    </div>
  ) : (
    <ActionButton className="mt-8 w-full" type="submit">
      Sign in
    </ActionButton>
  );
}
