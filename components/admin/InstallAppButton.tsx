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
  const [mobile, setMobile] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)");
    function update() {
      setPrompt(window.caseitInstallPrompt ?? null);
      setInstalled(Boolean(window.caseitAppInstalled) || standalone.matches || ("standalone" in navigator && navigator.standalone === true));
      setMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
        || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
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

  if (!mobile || installed) return null;

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        className="admin-button inline-flex min-h-11 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold"
        disabled={working}
        onClick={() => void install()}
        type="button"
      >
        {working ? "Installing..." : "Add app"}
      </button>
      {message && <p aria-live="polite" className="max-w-64 text-sm text-white/80" role="status">{message}</p>}
    </div>
  );
}
