import {copyFile, mkdir, readdir, readFile, rm, stat} from 'node:fs/promises';
import {join, relative, resolve} from 'node:path';

const [artifactArg, privateMapsArg] = process.argv.slice(2);
const expectedUrl = process.env.VITE_SUPABASE_URL;
if (!artifactArg || !privateMapsArg || !expectedUrl) {
  throw new Error('artifact path, private maps path and VITE_SUPABASE_URL are required');
}

const artifactDir = resolve(artifactArg);
const privateMapsDir = resolve(privateMapsArg);

async function filesUnder(directory) {
  const entries = await readdir(directory, {withFileTypes: true});
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  }));
  return nested.flat();
}

if (!(await stat(join(artifactDir, '_headers'))).isFile()) {
  throw new Error('dist/_headers is missing');
}

const sourceMaps = (await filesUnder(artifactDir)).filter((path) => path.endsWith('.map'));
if (sourceMaps.length === 0) throw new Error('no source maps were generated');

for (const sourceMap of sourceMaps) {
  const target = join(privateMapsDir, relative(artifactDir, sourceMap));
  await mkdir(resolve(target, '..'), {recursive: true});
  await copyFile(sourceMap, target);
  await rm(sourceMap);
}

const publicFiles = await filesUnder(artifactDir);
if (publicFiles.some((path) => path.endsWith('.map'))) {
  throw new Error('a source map remains in the public artifact');
}

let expectedUrlFound = false;
for (const path of publicFiles) {
  const content = await readFile(path, 'utf8');
  expectedUrlFound ||= content.includes(expectedUrl);
  if (/sb_secret_[A-Za-z0-9_-]{12,}/.test(content)) {
    throw new Error(`privileged Supabase key found in ${relative(artifactDir, path)}`);
  }
}
if (!expectedUrlFound) throw new Error('expected Supabase URL is absent from the public artifact');

console.log(`Cloudflare artifact ready: ${publicFiles.length} public files, ${sourceMaps.length} private source maps.`);
