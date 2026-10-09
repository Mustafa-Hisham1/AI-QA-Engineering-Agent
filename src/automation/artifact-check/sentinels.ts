/**
 * Dummy values the artifact check types into a local page and then searches
 * for in everything Playwright wrote. They are NOT credentials and match no
 * account anywhere — their only job is to be unmistakable when found.
 */
export const SENTINEL_USERNAME = 'artifactcheck-user-4b7d1e';
export const SENTINEL_PASSWORD = 'ArtifactCheck-Pw-9c2f5a';

export const SENTINELS = [SENTINEL_USERNAME, SENTINEL_PASSWORD] as const;
