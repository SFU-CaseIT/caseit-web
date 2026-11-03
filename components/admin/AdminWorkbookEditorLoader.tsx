"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const AdminWorkbookEditor = dynamic(() => import("./AdminWorkbookEditor"), {
  ssr: false,
  loading: () => (
    <div className="p-6">
      <LoadingSpinner label="Preparing workbook editor..." />
    </div>
  ),
});

export default function AdminWorkbookEditorLoader() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (!ready) {
    return (
      <section
        aria-label="CaseIT workbook editor"
        className="mt-8 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm"
      >
        <div className="p-6">
          <LoadingSpinner label="Preparing workbook editor..." />
        </div>
      </section>
    );
  }

  return <AdminWorkbookEditor />;
}
