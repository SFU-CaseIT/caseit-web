import { LoadingSpinner } from "@/components/animations/LoadingSpinner";

export default function AdminLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 text-white">
      <LoadingSpinner label="Loading..." light />
    </main>
  );
}
