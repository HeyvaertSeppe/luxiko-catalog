/*
 * One-off: AI-upscale (ESRGAN-thick, 4x) the 150x110 photos extracted from the
 * original PDF and save them as WebP in seed/images. Already done — only
 * needed again if the source photos change.
 *
 *   mkdir /tmp/upscale && cd /tmp/upscale && npm init -y
 *   npm install upscaler @upscalerjs/esrgan-thick @tensorflow/tfjs-node
 *   NODE_PATH=/tmp/upscale/node_modules SHARP=<repo>/node_modules/sharp \
 *     node <repo>/tools/upscale_photos.cjs <dir with CODE.png> <repo>/seed/images
 */
const fs = require("fs");
const path = require("path");
const tf = require("@tensorflow/tfjs-node");
const Upscaler = require("upscaler/node");
const model = require("@upscalerjs/esrgan-thick/4x");
const sharp = require(process.env.SHARP);

const [src, dst, ...only] = process.argv.slice(2);
fs.mkdirSync(dst, { recursive: true });
(async () => {
  const upscaler = new Upscaler({ model });
  const files = fs.readdirSync(src).filter((f) => f.endsWith(".png") && (!only.length || only.includes(f)));
  let n = 0;
  for (const f of files) {
    const out = path.join(dst, f.replace(/\.png$/, ".webp"));
    if (fs.existsSync(out)) { n++; continue; }
    const t0 = Date.now();
    // Flatten on white, then upscale
    // White margin around the photo avoids edge artifacts; cropped off afterwards
    const PAD = 8;
    const meta = await sharp(path.join(src, f)).metadata();
    const rgb = await sharp(path.join(src, f))
      .flatten({ background: "#ffffff" })
      .removeAlpha()
      .extend({ top: PAD, bottom: PAD, left: PAD, right: PAD, background: "#ffffff" })
      .png()
      .toBuffer();
    const input = tf.node.decodeImage(rgb, 3);
    const result = await upscaler.upscale(input, { output: "tensor", patchSize: 64, padding: 8 });
    const png = await tf.node.encodePng(tf.tidy(() => result.clipByValue(0, 255).round().cast("int32")));
    input.dispose(); result.dispose();
    await sharp(Buffer.from(png))
      .extract({ left: PAD * 4, top: PAD * 4, width: meta.width * 4, height: meta.height * 4 })
      .webp({ quality: 88, effort: 6 })
      .toFile(out);
    n++;
    console.log(`${n}/${files.length} ${f} ${Date.now() - t0}ms`);
  }
})();
