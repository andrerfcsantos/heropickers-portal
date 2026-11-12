/**
 * Renders the social card and the Apple touch icon into `public/`.
 *
 * Both outputs are committed, so this only needs re-running when the wording
 * or the branding changes. Kept as a script rather than a build step because
 * `sharp` renders SVG text through the system font stack, which is exactly the
 * kind of thing that should be reviewed by eye once rather than silently
 * re-rendered on every deploy.
 */
import fs from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");

const OW = "#f89e4a";
const VAL = "#ff4655";
const INK = "#0b0d12";

const WIDTH = 1200;
const HEIGHT = 630;

const SANS = "Inter, DejaVu Sans, Liberation Sans, Arial, sans-serif";

/** Left edge of the Valorant group (accent bar, logo, label) on the card. */
const VAL_GROUP_LEFT = 580;

const background = `
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
  <defs>
    <linearGradient id="wordmark" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${OW}"/>
      <stop offset="1" stop-color="${VAL}"/>
    </linearGradient>
    <radialGradient id="glowLeft" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${OW}" stop-opacity="0.30"/>
      <stop offset="1" stop-color="${OW}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowRight" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${VAL}" stop-opacity="0.30"/>
      <stop offset="1" stop-color="${VAL}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="${INK}"/>
  <ellipse cx="240" cy="120" rx="520" ry="380" fill="url(#glowLeft)"/>
  <ellipse cx="980" cy="140" rx="520" ry="380" fill="url(#glowRight)"/>

  <text x="80" y="250" font-family="${SANS}" font-size="86" font-weight="800"
        letter-spacing="-1" fill="url(#wordmark)">HERO PICKERS</text>

  <text x="80" y="330" font-family="${SANS}" font-size="40" font-weight="600" fill="#e7ebf3">
    Can&#8217;t decide who to play?
  </text>

  <text x="80" y="392" font-family="${SANS}" font-size="29" fill="#97a1b8">
    Random hero and agent pickers for Overwatch and Valorant.
  </text>
  <text x="80" y="436" font-family="${SANS}" font-size="29" fill="#97a1b8">
    Filter to what you actually play, then roll. Free, no ads.
  </text>

  <rect x="80" y="512" width="14" height="44" rx="4" fill="${OW}"/>
  <rect x="${VAL_GROUP_LEFT}" y="512" width="14" height="44" rx="4" fill="${VAL}"/>
  <line x1="80" y1="586" x2="1120" y2="586" stroke="#262d3d" stroke-width="2"/>
  <text x="80" y="618" font-family="${SANS}" font-size="22" fill="#6b7488">
    heropickers.com
  </text>
</svg>`;

const LOGO_HEIGHT = 56;
const LOGO_TOP = 506;
const OW_LOGO_LEFT = 112;
const VAL_LOGO_LEFT = VAL_GROUP_LEFT + 32;
const LABEL_GAP = 18;

/** Labels sit next to each logo, so their x depends on the logo's width. */
function labels(owLabelX: number, valLabelX: number): string {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
  <text x="${owLabelX}" y="544" font-family="${SANS}" font-size="30" font-weight="600" fill="#e7ebf3">
    owheropicker.com
  </text>
  <text x="${valLabelX}" y="544" font-family="${SANS}" font-size="30" font-weight="600" fill="#e7ebf3">
    valorantpicker.com
  </text>
</svg>`;
}

/** Scales a picker logo to LOGO_HEIGHT, keeping its aspect ratio. */
async function loadLogo(
  ...segments: string[]
): Promise<{ input: Buffer; width: number }> {
  const { data, info } = await sharp(path.join(PUBLIC_DIR, ...segments))
    .resize({ height: LOGO_HEIGHT })
    .png()
    .toBuffer({ resolveWithObject: true });
  return { input: data, width: info.width };
}

async function generateSocialCard(): Promise<void> {
  const owLogo = await loadLogo("imgs", "overwatch", "hero-picker-logo.webp");
  const valLogo = await loadLogo("imgs", "valorant", "agent-picker-logo.webp");

  const owLabelX = OW_LOGO_LEFT + owLogo.width + LABEL_GAP;
  const valLabelX = VAL_LOGO_LEFT + valLogo.width + LABEL_GAP;

  await sharp(Buffer.from(background))
    .composite([
      { input: Buffer.from(labels(owLabelX, valLabelX)), top: 0, left: 0 },
      { input: owLogo.input, top: LOGO_TOP, left: OW_LOGO_LEFT },
      { input: valLogo.input, top: LOGO_TOP, left: VAL_LOGO_LEFT },
    ])
    .png()
    .toFile(path.join(PUBLIC_DIR, "og.png"));
}

async function generateTouchIcon(): Promise<void> {
  const favicon = await fs.readFile(path.join(PUBLIC_DIR, "favicon.svg"));

  // iOS ignores transparency and composites onto white, so the rounded corners
  // of the source mark are flattened against the page background instead.
  await sharp(favicon, { density: 600 })
    .resize(180, 180)
    .flatten({ background: INK })
    .png()
    .toFile(path.join(PUBLIC_DIR, "apple-touch-icon.png"));
}

await generateSocialCard();
await generateTouchIcon();

console.log("Wrote public/og.png and public/apple-touch-icon.png");
