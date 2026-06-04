export function parseJsonPayload(reply) {
  if (!reply || typeof reply !== 'string') return null;

  const start = reply.indexOf('{');
  if (start === -1) return null;

  const end = reply.lastIndexOf('}');
  if (end === -1 || end <= start) return null;

  try {
    const jsonStr = reply.substring(start, end + 1);
    const parsed = JSON.parse(jsonStr);

    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
    return null;
  } catch (e) {
    console.error('JSON parse error:', e.message);
    return null;
  }
}
