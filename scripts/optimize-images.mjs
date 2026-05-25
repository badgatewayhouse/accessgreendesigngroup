import sharp from 'sharp';
import { readdir, stat, mkdir } from 'fs/promises';
import path from 'path';

const INPUT_DIR = 'images-src';
const OUTPUT_DIR = 'consultancy/images';

const SIZES = [
  { suffix: '800w', width: 800, quality: 80 },
  { suffix: '160w', width: 160, quality: 75 },
];

const SUPPORTED_EXTS = new Set(['.jpg', '.jpeg', '.png', '.tiff', '.webp']);

async function getSourceImages() {
  const entries = await readdir(INPUT_DIR);
  return entries.filter(f => SUPPORTED_EXTS.has(path.extname(f).toLowerCase()));
}

async function isNewer(srcPath, destPath) {
  try {
    const [srcStat, destStat] = await Promise.all([stat(srcPath), stat(destPath)]);
    return srcStat.mtimeMs > destStat.mtimeMs;
  } catch {
    return true;
  }
}

async function optimizeImage(filename) {
  const srcPath = path.join(INPUT_DIR, filename);
  const basename = path.basename(filename, path.extname(filename));
  let processed = 0;

  for (const size of SIZES) {
    const outName = `${basename}-${size.suffix}.webp`;
    const outPath = path.join(OUTPUT_DIR, outName);

    if (!(await isNewer(srcPath, outPath))) {
      continue;
    }

    await sharp(srcPath)
      .resize({ width: size.width, withoutEnlargement: true })
      .webp({ quality: size.quality })
      .toFile(outPath);

    const outStat = await stat(outPath);
    const kb = (outStat.size / 1024).toFixed(1);
    console.log(`  ${outName} (${kb} KB)`);
    processed++;
  }

  return processed;
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const images = await getSourceImages();
  if (images.length === 0) {
    console.log(`No images found in ${INPUT_DIR}/`);
    console.log('Drop your source photos there and re-run.');
    process.exit(0);
  }

  console.log(`Found ${images.length} source image(s) in ${INPUT_DIR}/\n`);

  let totalProcessed = 0;
  for (const img of images) {
    console.log(img);
    const count = await optimizeImage(img);
    totalProcessed += count;
  }

  const outputFiles = (await readdir(OUTPUT_DIR)).filter(f => f.endsWith('.webp'));
  let totalBytes = 0;
  for (const f of outputFiles) {
    const s = await stat(path.join(OUTPUT_DIR, f));
    totalBytes += s.size;
  }

  console.log(`\nDone. ${totalProcessed} file(s) generated.`);
  console.log(`Total WebP output: ${(totalBytes / 1024 / 1024).toFixed(2)} MB across ${outputFiles.length} files.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
