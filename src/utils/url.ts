export const sanitizeProductUrl = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  const firstHttp = trimmed.search(/https?:\/\//i);
  if (firstHttp < 0) return trimmed;

  let candidate = trimmed.slice(firstHttp).trim();

  const encodedIndex = candidate.search(/https?%3A%2F%2F/i);
  if (encodedIndex > 0) {
    candidate = candidate.slice(0, encodedIndex).trim();
  }

  const secondHttp = candidate.slice(8).search(/https?:\/\//i);
  if (secondHttp >= 0) {
    candidate = candidate.slice(0, secondHttp + 8).trim();
  }

  return candidate;
};
