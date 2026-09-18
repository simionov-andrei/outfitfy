export function cloudSyncConfigured() {
  return Boolean(
    (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ||
      (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET)
  );
}

export function pinterestConfigured() {
  return Boolean(process.env.PINTEREST_CLIENT_ID && process.env.PINTEREST_CLIENT_SECRET);
}
