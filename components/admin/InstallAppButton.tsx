"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    caseitInstallPrompt?: InstallPromptEvent | null;
    caseitAppInstalled?: boolean;
  }
}

export default function InstallAppButton() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)");
    function update() {
      setPrompt(window.caseitInstallPrompt ?? null);
      setInstalled(Boolean(window.caseitAppInstalled) || standalone.matches || ("standalone" in navigator && navigator.standalone === true));
    }
    update();
    window.addEventListener("caseit-install-change", update);
    standalone.addEventListener("change", update);
    return () => {
      window.removeEventListener("caseit-install-change", update);
      standalone.removeEventListener("change", update);
    };
  }, []);

  async function install() {
    setMessage("");
    if (!prompt) {
      const appleMobile = /iPad|iPhone|iPod/.test(navigator.userAgent)
        || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      setMessage(appleMobile
        ? "In Safari, tap Share, then Add to Home Screen."
        : "Use your browser menu to install the app or add it to your home screen. If unavailable, try a supported browser over HTTPS.");
      return;
    }

    setWorking(true);
    window.caseitInstallPrompt = null;
    setPrompt(null);
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "dismissed") setMessage("Cancelled.");
    } catch (error) {
      console.error("Could not open the app installation prompt.", error);
      setMessage("Could not open the installation prompt. Use your browser menu to install the app.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        className="inline-flex min-h-11 items-center justify-center rounded-md border border-black/20 bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:border-black/40 hover:bg-black/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:opacity-50"
        disabled={installed || working}
        onClick={() => void install()}
        type="button"
      >
        {installed ? "App installed" : working ? "Installing..." : "Add app"}
      </button>
      {message && <p aria-live="polite" className="max-w-64 text-sm text-black/60" role="status">{message}</p>}
    </div>
  );
}
