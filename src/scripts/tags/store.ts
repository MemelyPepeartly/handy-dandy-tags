import { MODULE_ID, FLAG_KEY } from "../constants";
import {
  FILTER_SETTINGS,
  getTagFilterSetting,
  getShowPlaylistTagsOnTracks,
  setTagFilterSetting,
} from "../setup/settings";
import {
  listHasTag,
  normalizeTag,
  normalizeTagList,
  readStoredTags,
  removeTagFromList,
  replaceTagInList,
  sameTag,
} from "./model";

export type TagDocument = Playlist | PlaylistSound | NoteDocument.Implementation | JournalEntry;

type FlagBearer = {
  getFlag: (scope: string, key: string) => unknown;
  setFlag: (scope: string, key: string, value: unknown) => Promise<unknown>;
  unsetFlag: (scope: string, key: string) => Promise<unknown>;
  canUserModify: (user: User, action: string) => boolean;
  id: string | null;
  documentName: string;
};

function asFlagBearer(document: TagDocument): FlagBearer {
  return document as unknown as FlagBearer;
}

function readyGame(): ReadyGame {
  return game as ReadyGame;
}

export function getTags(document: TagDocument): string[] {
  return readStoredTags(asFlagBearer(document).getFlag(MODULE_ID, FLAG_KEY));
}

export async function setTags(document: TagDocument, tags: readonly string[]): Promise<void> {
  const user = readyGame().user;
  const bearer = asFlagBearer(document);
  if (!user?.isGM || !bearer.canUserModify(user, "update")) {
    return;
  }

  const normalized = normalizeTagList(tags);
  if (normalized.length === 0) {
    await bearer.unsetFlag(MODULE_ID, FLAG_KEY);
    return;
  }
  await bearer.setFlag(MODULE_ID, FLAG_KEY, normalized);
}

export function getEffectiveTags(document: TagDocument): string[] {
  if (
    document instanceof PlaylistSound &&
    getShowPlaylistTagsOnTracks() &&
    document.parent instanceof Playlist
  ) {
    return normalizeTagList([...getTags(document.parent), ...getTags(document)]);
  }
  return getTags(document);
}

export function getInheritedTags(sound: PlaylistSound): string[] {
  if (!getShowPlaylistTagsOnTracks() || !(sound.parent instanceof Playlist)) {
    return [];
  }
  const storedOnSound = getTags(sound);
  return getTags(sound.parent).filter((tag) => !listHasTag(storedOnSound, tag));
}

function playlists(): Playlist[] {
  return readyGame().playlists?.contents ?? [];
}

export function* iterateTaggedDocuments(): Generator<TagDocument> {
  for (const playlist of playlists()) {
    yield playlist;
    const sounds = playlist.getEmbeddedCollection("PlaylistSound");
    for (const sound of sounds.contents) {
      yield sound;
    }
  }

  const scenes = readyGame().scenes?.contents ?? [];
  for (const scene of scenes) {
    const notes = scene.getEmbeddedCollection("Note");
    for (const note of notes.contents) {
      yield note;
    }
  }

  const journal = readyGame().journal?.contents ?? [];
  for (const entry of journal) {
    yield entry;
  }
}

async function syncFilterSettingsAfterRename(from: string, to: string): Promise<void> {
  for (const key of FILTER_SETTINGS) {
    const current = getTagFilterSetting(key);
    if (current && sameTag(current, from)) {
      await setTagFilterSetting(key, to);
    }
  }
}

async function syncFilterSettingsAfterDelete(tag: string): Promise<void> {
  for (const key of FILTER_SETTINGS) {
    const current = getTagFilterSetting(key);
    if (current && sameTag(current, tag)) {
      await setTagFilterSetting(key, "");
    }
  }
}

export async function renameTagEverywhere(from: string, to: string): Promise<void> {
  const user = readyGame().user;
  if (!user?.isGM) {
    return;
  }

  const fromTag = normalizeTag(from);
  const toTag = normalizeTag(to);
  if (!fromTag || !toTag || sameTag(fromTag, toTag)) {
    return;
  }

  for (const document of iterateTaggedDocuments()) {
    const stored = getTags(document);
    if (!listHasTag(stored, fromTag)) {
      continue;
    }
    const next = replaceTagInList(stored, fromTag, toTag);
    if (next.length === stored.length && next.every((tag, index) => tag === stored[index])) {
      continue;
    }
    await setTags(document, next);
  }

  await syncFilterSettingsAfterRename(fromTag, toTag);
}

export async function deleteTagEverywhere(tag: string): Promise<void> {
  const user = readyGame().user;
  if (!user?.isGM) {
    return;
  }

  const normalized = normalizeTag(tag);
  if (!normalized) {
    return;
  }

  for (const document of iterateTaggedDocuments()) {
    const stored = getTags(document);
    if (!listHasTag(stored, normalized)) {
      continue;
    }
    const next = removeTagFromList(stored, normalized);
    await setTags(document, next);
  }

  await syncFilterSettingsAfterDelete(normalized);
}

export function collectDatasetValues(element: HTMLElement): Set<string> {
  const values = new Set<string>();
  let node: HTMLElement | null = element;
  while (node) {
    const dataset = node.dataset;
    for (const key of Object.keys(dataset)) {
      const value = dataset[key];
      if (value) {
        values.add(value);
      }
    }
    node = node.parentElement;
  }
  return values;
}

function resolvePlaylistSound(values: Set<string>): PlaylistSound | null {
  for (const playlist of playlists()) {
    const playlistId = playlist.id ?? "";
    if (!playlistId || !values.has(playlistId)) {
      continue;
    }
    const sounds = playlist.getEmbeddedCollection("PlaylistSound");
    for (const sound of sounds.contents) {
      const soundId = sound.id ?? "";
      if (soundId && values.has(soundId)) {
        return sound;
      }
    }
  }
  return null;
}

function resolvePlaylist(values: Set<string>): Playlist | null {
  for (const playlist of playlists()) {
    const playlistId = playlist.id ?? "";
    if (!playlistId || !values.has(playlistId)) {
      continue;
    }
    const sounds = playlist.getEmbeddedCollection("PlaylistSound");
    const nestedSound = sounds.contents.some((sound) => {
      const soundId = sound.id ?? "";
      return soundId && values.has(soundId);
    });
    if (!nestedSound) {
      return playlist;
    }
  }
  return null;
}

function resolveNote(values: Set<string>): NoteDocument.Implementation | null {
  const scene = readyGame().scenes?.viewed;
  if (!scene) {
    return null;
  }
  const notes = scene.getEmbeddedCollection("Note");
  for (const note of notes.contents) {
    const noteId = note.id ?? "";
    if (noteId && values.has(noteId)) {
      return note;
    }
  }
  return null;
}

function resolveJournalEntry(values: Set<string>): JournalEntry | null {
  const entries = readyGame().journal?.contents ?? [];
  for (const entry of entries) {
    const entryId = entry.id ?? "";
    if (entryId && values.has(entryId)) {
      return entry;
    }
  }
  return null;
}

export function resolveDocumentFromElement(target: HTMLElement): TagDocument | null {
  const values = collectDatasetValues(target);
  if (values.size === 0) {
    return null;
  }

  const sound = resolvePlaylistSound(values);
  if (sound) {
    return sound;
  }

  const playlist = resolvePlaylist(values);
  if (playlist) {
    return playlist;
  }

  const note = resolveNote(values);
  if (note) {
    return note;
  }

  return resolveJournalEntry(values);
}

export function canEditTags(document: TagDocument): boolean {
  const user = readyGame().user;
  const bearer = asFlagBearer(document);
  return Boolean(user?.isGM && bearer.canUserModify(user, "update"));
}

export function documentsMatch(a: TagDocument, b: TagDocument): boolean {
  return a.id === b.id && a.documentName === b.documentName;
}

export { normalizeTag, listHasTag };
