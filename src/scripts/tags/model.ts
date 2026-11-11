const MAX_TAG_LENGTH = 32;
const MAX_TAGS = 24;

function hasAsciiControl(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code < 32 || code === 127) {
      return true;
    }
  }
  return false;
}

export function normalizeTag(value: string): string | null {
  const normalized = value.trim().normalize("NFC").replace(/\s+/g, " ");
  if (!normalized || normalized.length > MAX_TAG_LENGTH || hasAsciiControl(normalized)) {
    return null;
  }
  return normalized;
}

export function normalizeTagList(values: readonly string[]): string[] {
  const seen = new Map<string, string>();
  for (const raw of values) {
    const tag = normalizeTag(raw);
    if (!tag) {
      continue;
    }
    const key = tag.toLocaleLowerCase();
    if (!seen.has(key)) {
      seen.set(key, tag);
    }
    if (seen.size >= MAX_TAGS) {
      break;
    }
  }
  return [...seen.values()];
}

export function sameTag(a: string, b: string): boolean {
  return a.toLocaleLowerCase() === b.toLocaleLowerCase();
}

export function listHasTag(tags: readonly string[], tag: string): boolean {
  const needle = tag.toLocaleLowerCase();
  return tags.some((entry) => entry.toLocaleLowerCase() === needle);
}

export function readStoredTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const strings = value.filter((entry): entry is string => typeof entry === "string");
  return normalizeTagList(strings);
}
