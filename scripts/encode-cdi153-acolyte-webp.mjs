import { chromium } from 'playwright';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join, basename } from 'node:path';

const root = 'assets/design/hero-sprites/cdi-153';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
try {
  for (const gender of ['male', 'female']) {
    const sourceDir = join(root, 'normalized-alpha-v1', gender);
    const outputDir = join(root, 'runtime-webp-v1', gender);
    await mkdir(outputDir, { recursive: true });
    for (const file of (await readdir(sourceDir)).filter((file) => file.endsWith('.png'))) {
      const png = await readFile(join(sourceDir, file));
      const dataUri = `data:image/png;base64,${png.toString('base64')}`;
      const webpUri = await page.evaluate(async (uri) => {
        const image = new Image();
        image.src = uri;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        canvas.getContext('2d').drawImage(image, 0, 0);
        return canvas.toDataURL('image/webp', 0.88);
      }, dataUri);
      if (!webpUri.startsWith('data:image/webp;base64,')) throw new Error(`WebP unavailable for ${file}`);
      const output = Buffer.from(webpUri.split(',')[1], 'base64');
      const outputName = basename(file, '.png') + '.webp';
      await writeFile(join(outputDir, outputName), output);
      console.log(`${outputName} ${png.length} -> ${output.length} bytes`);
    }
  }
} finally {
  await browser.close();
}
