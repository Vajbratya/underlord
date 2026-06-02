# Underlord → Google Play (PWA as TWA)

The game ships to Google Play as a **Trusted Web Activity (TWA)** — a thin Android
wrapper around the live PWA (https://rps-original.vercel.app). No game rewrite; the
store app loads the same site fullscreen.

## What's already done ✅

- **PWA manifest** is TWA-ready (name, 192+512 icons incl. maskable, `display: standalone`, portrait, theme/background colors, categories).
- **Digital Asset Links** deployed + verified live: `https://rps-original.vercel.app/.well-known/assetlinks.json` (HTTP 200). This is what makes the TWA open WITHOUT the browser URL bar.
- **Signing keystore** generated: `android-twa/android.keystore` (alias `underlord`). ⚠️ **gitignored — keep this file + its password safe; losing it means you can never update the app.** Password used: `underlord2026` (change for a real release).
- **TWA config**: `android-twa/twa-manifest.json` (package `com.vajbratya.underlord`).
- Upload-key SHA256 already in assetlinks: `14:64:6F:55:2D:94:24:66:2E:9F:70:97:FC:12:91:72:58:E6:0B:5C:83:6F:BC:60:3D:52:0E:9C:2A:DF:FE:8F`

## Build the app bundle (.aab)

Bubblewrap (Google's CLI) is set up. To (re)build:

```bash
cd android-twa
export JAVA_HOME=/opt/homebrew/opt/openjdk@17
export BUBBLEWRAP_KEYSTORE_PASSWORD=underlord2026
export BUBBLEWRAP_KEY_PASSWORD=underlord2026
npx @bubblewrap/cli build --skipPwaValidation
```

Output: `app-release-bundle.aab` (upload this to Play) + `app-release-signed.apk` (sideload to test on a device).

**No local toolchain? Use [PWABuilder](https://www.pwabuilder.com/)** — paste `https://rps-original.vercel.app`, choose Android, download the package. Same result, zero setup.

## Publish (manual — only you can do these)

1. Create a **Google Play Console** account (one-time **$25**).
2. Create app → upload `app-release-bundle.aab` to the Internal testing track first.
3. Fill the listing: title, short/full description (the lore copy is gold), screenshots (grab from the live game), a 512×512 icon + feature graphic, content rating, privacy policy URL.
4. ⚠️ **Play App Signing caveat:** Play re-signs your app with ITS OWN key. After creating the app, go to **Play Console → Test and release → App integrity → App signing** and copy the **SHA-256 of the "App signing key certificate"**. Add it to `public/.well-known/assetlinks.json` (the array supports multiple fingerprints — keep the upload key too), commit, and redeploy. Otherwise the released app shows the URL bar.

## Monetization on Play (later)

TWA monetization is weak (it's a webview). For real mobile money use the web ad/portal route (see `docs/` notes) or a Capacitor wrap with AdMob + Play Billing. Play via TWA is best treated as a distribution channel, not the revenue engine.
