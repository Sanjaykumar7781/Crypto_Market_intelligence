const memory = new Map();

export async function cached(key, ttlMs, factory) {
  const hit = memory.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    return hit.value;
  }

  const value = await factory();
  memory.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export function clearCache(prefix = '') {
  for (const key of memory.keys()) {
    if (!prefix || key.startsWith(prefix)) memory.delete(key);
  }
}
