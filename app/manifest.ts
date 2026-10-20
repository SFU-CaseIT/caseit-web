import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/admin",
    name: "CaseIT Executive Schedules",
    short_name: "CaseIT Exec",
    description: "Quick access to CaseIT executive tools.",
    start_url: "/admin",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#d51e28",
    icons: [
      {
        src: "/pwa/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
