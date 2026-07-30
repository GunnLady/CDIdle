export const LOCAL_BUILD_VERSION = "local-dev";

const GIT_SHA_PATTERN = /^[0-9a-f]{7,40}$/i;

export function resolveBuildVersion(rawSha?: string): string {
  const sha = rawSha?.trim();
  return sha && GIT_SHA_PATTERN.test(sha)
    ? `git-${sha.toLowerCase()}`
    : LOCAL_BUILD_VERSION;
}

export function shortBuildVersion(version: string): string {
  if (!version.startsWith("git-")) return version;
  return `git-${version.slice(4, 16)}`;
}

export const BUILD_VERSION = resolveBuildVersion(import.meta.env.VITE_BUILD_SHA);
export const DISPLAY_BUILD_VERSION = shortBuildVersion(BUILD_VERSION);
