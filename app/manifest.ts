import type { MetadataRoute } from "next"

/**
 * PWA manifest — produces /manifest.webmanifest at build time.
 *
 * Why two icon sizes + `purpose: "maskable any"`?
 * - 192 satisfies Android home-screen requirements.
 * - 512 is required for the install prompt and the splash screen Android
 *   composes when the PWA launches.
 * - "maskable any" lets the OS crop into a circle/squircle for adaptive
 *   icons WITHOUT cropping the crown out (the source art has padding).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UNDERLORD — As Cinzas da Coroa Submersa",
    short_name: "Underlord",
    description:
      "Tática turn-based em hex. Você é o último Underlord. Comande broods de minions e descarregue 14 séculos de raiva.",
    lang: "pt-BR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b0608",
    theme_color: "#1a0f0a",
    categories: ["games", "strategy", "entertainment"],
    // Each size is declared twice — once as "any" (used by browser tabs,
    // splash screens) and once as "maskable" (used by Android adaptive
    // icons that crop the image into a circle/squircle). Splitting them
    // satisfies Next.js's stricter MetadataRoute.Manifest typing.
    icons: [
      { src: "/icon-192.jpg", sizes: "192x192", type: "image/jpeg", purpose: "any" },
      { src: "/icon-192.jpg", sizes: "192x192", type: "image/jpeg", purpose: "maskable" },
      { src: "/icon-512.jpg", sizes: "512x512", type: "image/jpeg", purpose: "any" },
      { src: "/icon-512.jpg", sizes: "512x512", type: "image/jpeg", purpose: "maskable" },
    ],
  }
}
