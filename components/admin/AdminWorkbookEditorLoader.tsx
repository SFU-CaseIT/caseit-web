"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/animations/LoadingSpinner";

const AdminWorkbookEditor = dynamic(() => import("./AdminWorkbookEditor"), {
  ssr: false,
  loading: () => (
    <div className="p-6">
      <LoadingSpinner label="Preparing workbook editor..." light />
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
        className="mt-8 overflow-hidden rounded-2xl border border-white/20 bg-black/20"
      >
        <div className="p-6">
          <LoadingSpinner label="Preparing workbook editor..." light />
        </div>
      </section>
    );
  }

  return <AdminWorkbookEditor />;
}
