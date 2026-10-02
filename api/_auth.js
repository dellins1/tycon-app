// Shared access check for the API routes (files starting with "_" are not routes).
// A request must send header `x-tycon-key` equal to APP_PASSWORD (Dave, from the app)
// or ROUTINE_KEY (the scheduled routines on Dave's PC). Both live in Vercel's
// environment variables, never in this public repo. If neither is set, everyone is
// refused rather than the data being left open.

function sameText(a, b) {
  // Constant-time comparison so response timing doesn't reveal how much of a key matched.
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Returns null when allowed, otherwise { status, error } to send back.
export function checkAccess(sentKey) {
  const keys = [process.env.APP_PASSWORD, process.env.ROUTINE_KEY].filter(Boolean);
  if (!keys.length) return { status: 503, error: 'Access is not configured on the server.' };
  if (!sentKey || !keys.some(k => sameText(String(sentKey), k))) return { status: 401, error: 'Password required.' };
  return null;
}
