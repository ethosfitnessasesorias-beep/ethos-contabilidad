// Genera los iconos PNG de la PWA a partir de un SVG simple.
// Uso: node scripts/generar-iconos.mjs
import sharp from "sharp";

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <rect width="512" height="512" rx="96" fill="#09090b"/>
  <text x="256" y="256" font-family="Arial, sans-serif" font-size="300" font-weight="900"
        fill="#10b981" text-anchor="middle" dominant-baseline="central">E</text>
</svg>`;

for (const size of [192, 512]) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(`public/icon-${size}.png`);
  console.log(`public/icon-${size}.png generado`);
}
