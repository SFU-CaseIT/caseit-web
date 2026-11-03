import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function AdminLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 text-black">
      <LoadingSpinner label="Loading your admin workspace..." />
    </main>
  );
}
