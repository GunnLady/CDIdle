// Rebuild runtime exports and their identity/hash manifest from validated normalized PNGs.
import { createHash } from "node:crypto";
﻿import { chromium } from 'playwright';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join, basename } from 'node:path';

const root = 'assets/design/hero-sprites/cdi-154';
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

const entries = [];
for (const gender of ['male', 'female']) {
  for (let index = 1; index <= 10; index += 1) {
    const stem = `aede-${gender}-${String(index).padStart(2, '0')}`;
    const paths = {
      neutral: `assets/design/hero-sprites/cdi-142/normalized-alpha-v1/${gender}/${stem}-v1.png`,
      approvedSource: `${root}/validated-${gender}-v1/${stem}-combat-idle-v1.png`,
      normalized: `${root}/normalized-alpha-v1/${gender}/${stem}-combat-idle-v1.png`,
      runtime: `${root}/runtime-webp-v1/${gender}/${stem}-combat-idle-v1.webp`,
    };
    const [source, normalized, runtime] = await Promise.all(
      [paths.approvedSource, paths.normalized, paths.runtime].map((path) => readFile(path)),
    );
    const hash = (buffer) => createHash('sha256').update(buffer).digest('hex');
    entries.push({
      key: `A\u00e8de_${gender === 'male' ? 'Male' : 'Female'}_${index - 1}@combat_idle`,
      ...paths,
      sourceSha256: hash(source), normalizedSha256: hash(normalized), runtimeSha256: hash(runtime),
      runtimeBytes: runtime.length, frame: [normalized.readUInt32BE(16), normalized.readUInt32BE(20)],
    });
  }
}
await writeFile(join(root, 'manifest.json'), JSON.stringify({ schemaVersion: 1, ticket: 'CDI-154', entries }, null, 2) + '\n');
