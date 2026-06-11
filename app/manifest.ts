import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FIFA World Cup 2026 Simulator",
    short_name: "WC2026",
    description: "Build your bracket, simulate matches, and crown your champion for the FIFA World Cup 2026.",
    start_url: "/",
    display: "standalone",
    background_color: "#111316",
    theme_color: "#00ff41",
    orientation: "portrait-primary",
    icons: [
      { src: "/icons/icon.svg", sizes: "512x512", type: "image/svg+xml" },
      { src: "/icons/icon.svg", sizes: "192x192", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
