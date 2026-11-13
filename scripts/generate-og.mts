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
// The portal's slate palette (src/style.css). Every colour is flat.
const PAGE = "#2c3e50";
const DEEP = "#212f3d";
const TEXT = "#ffffff";
const MUTED = "#c2ccd7";

const WIDTH = 1200;
const HEIGHT = 630;

const SANS = "Inter, DejaVu Sans, Liberation Sans, Arial, sans-serif";

/** Left edge of the Valorant group (accent bar, logo, label) on the card. */
const VAL_GROUP_LEFT = 580;

const background = `
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${PAGE}"/>
  <rect y="480" width="${WIDTH}" height="${HEIGHT - 480}" fill="${DEEP}"/>

  <text x="80" y="250" font-family="${SANS}" font-size="86" font-weight="800"
        letter-spacing="-1" fill="${TEXT}">HERO PICKERS</text>

  <text x="80" y="330" font-family="${SANS}" font-size="40" font-weight="600" fill="${TEXT}">
    Can&#8217;t decide who to play?
  </text>

  <text x="80" y="392" font-family="${SANS}" font-size="29" fill="${MUTED}">
    Random hero and agent pickers for Overwatch and Valorant.
  </text>
  <text x="80" y="436" font-family="${SANS}" font-size="29" fill="${MUTED}">
    Filter to what you actually play, then roll. Free, no ads.
  </text>

  <rect x="80" y="512" width="14" height="44" fill="${OW}"/>
  <rect x="${VAL_GROUP_LEFT}" y="512" width="14" height="44" fill="${VAL}"/>
  <text x="80" y="612" font-family="${SANS}" font-size="22" fill="${MUTED}">
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
  <text x="${owLabelX}" y="544" font-family="${SANS}" font-size="30" font-weight="600" fill="${TEXT}">
    owheropicker.com
  </text>
  <text x="${valLabelX}" y="544" font-family="${SANS}" font-size="30" font-weight="600" fill="${TEXT}">
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
    .flatten({ background: DEEP })
    .png()
    .toFile(path.join(PUBLIC_DIR, "apple-touch-icon.png"));
}

await generateSocialCard();
await generateTouchIcon();

console.log("Wrote public/og.png and public/apple-touch-icon.png");
