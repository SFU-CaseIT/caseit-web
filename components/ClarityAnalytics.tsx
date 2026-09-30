"use client";

import { useEffect } from "react";
import { useRef, useState } from "react";
import Clarity from "@microsoft/clarity";

const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
const CONSENT_KEY = "caseit-clarity-consent";
const CONSENT_VERSION = "1";
const CONSENT_MAX_AGE = 180 * 24 * 60 * 60 * 1000;

type ConsentChoice = "unset" | "accepted" | "rejected";

type StoredConsent = {
  choice: Exclude<ConsentChoice, "unset">;
  updatedAt: number;
  version: string;
};

function readConsent(): ConsentChoice {
  try {
    const saved = window.localStorage.getItem(CONSENT_KEY);
    if (!saved) return "unset";

    const consent = JSON.parse(saved) as StoredConsent;
    const age = Date.now() - consent.updatedAt;

    if (
      consent.version === CONSENT_VERSION &&
      (consent.choice === "accepted" || consent.choice === "rejected") &&
      age >= 0 &&
      age < CONSENT_MAX_AGE
    ) {
      return consent.choice;
    }
  } catch {
    return "unset";
  }

  return "unset";
}

export function ClarityAnalytics() {
  const [choice, setChoice] = useState<ConsentChoice>("unset");
  const [ready, setReady] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const restoreFocusRef = useRef(false);

  useEffect(() => {
    setChoice(readConsent());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || choice !== "accepted" || !projectId) return;

    Clarity.init(projectId);
    Clarity.consentV2({
      ad_Storage: "denied",
      analytics_Storage: "granted",
    });
  }, [choice, ready]);

  useEffect(() => {
    if (settingsOpen) {
      headingRef.current?.focus();
    } else if (restoreFocusRef.current) {
      settingsButtonRef.current?.focus();
      restoreFocusRef.current = false;
    }
  }, [settingsOpen]);

  function saveChoice(nextChoice: Exclude<ConsentChoice, "unset">) {
    const wasAccepted = choice === "accepted";
    const consent: StoredConsent = {
      choice: nextChoice,
      updatedAt: Date.now(),
      version: CONSENT_VERSION,
    };

    try {
      window.localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    } catch {
      if (nextChoice === "rejected") {
        try {
          window.localStorage.removeItem(CONSENT_KEY);
        } catch {
          // Keep the current page in the rejected state if storage is unavailable.
        }
      }
    }

    setChoice(nextChoice);
    setSettingsOpen(false);

    if (nextChoice === "rejected" && wasAccepted) {
      Clarity.consentV2({
        ad_Storage: "denied",
        analytics_Storage: "denied",
      });
      window.location.reload();
    }
  }

  function openSettings() {
    restoreFocusRef.current = true;
    setSettingsOpen(true);
  }

  if (!projectId || !ready) return null;

  const showBanner = choice === "unset" || settingsOpen;

  return (
    <>
      {showBanner ? (
        <section
          aria-labelledby="clarity-consent-title"
          className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-h-[calc(100dvh-2rem)] max-w-2xl overflow-y-auto border-t-4 border-redDark bg-white p-5 text-black shadow-2xl sm:p-6 md:left-auto md:right-6 md:mx-0"
          role="region"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase text-redDark">
                Privacy choices
              </p>
              <h2
                className="mt-1 text-lg font-bold"
                id="clarity-consent-title"
                ref={headingRef}
                tabIndex={-1}
              >
                Help us improve CaseIT
              </h2>
            </div>
            {settingsOpen && choice !== "unset" && (
              <button
                aria-label="Close cookie settings"
                className="rounded-sm px-2 py-1 text-sm font-semibold underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-redDark"
                onClick={() => setSettingsOpen(false)}
                type="button"
              >
                Close
              </button>
            )}
          </div>

          <p className="mt-3 text-sm leading-6 text-black/75">
            We use Microsoft Clarity to understand visits and interactions on
            CaseIT&apos;s public pages. Clarity loads only if you accept. You can
            change your choice at any time in Cookie settings. See the{" "}
            <a
              className="font-semibold text-redDark underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-redDark"
              href="https://www.sfu.ca/contact/terms-conditions/privacy.html"
              rel="noreferrer"
              target="_blank"
            >
              SFU Privacy Policy
            </a>
            .
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              className="min-h-11 border-2 border-redDark bg-redDark px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-buttonRedDark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
              onClick={() => saveChoice("accepted")}
              type="button"
            >
              Accept analytics
            </button>
            <button
              className="min-h-11 border-2 border-black bg-white px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-greyDark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-redDark"
              onClick={() => saveChoice("rejected")}
              type="button"
            >
              Reject analytics
            </button>
          </div>
        </section>
      ) : (
        <button
          className="fixed bottom-4 right-4 z-[90] border border-black/20 bg-white px-3 py-2 text-xs font-semibold text-black shadow-md transition-colors hover:bg-greyDark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-redDark"
          onClick={openSettings}
          ref={settingsButtonRef}
          type="button"
        >
          Cookie settings
        </button>
      )}
    </>
  );
}