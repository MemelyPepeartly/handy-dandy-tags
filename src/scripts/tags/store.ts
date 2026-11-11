import { MODULE_ID, FLAG_KEY } from "../constants";
import { listHasTag, normalizeTag, normalizeTagList, readStoredTags } from "./model";

export type TagDocument = Playlist | PlaylistSound | NoteDocument.Implementation;

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

function playlists(): Playlist[] {
  return readyGame().playlists?.contents ?? [];
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

  return resolveNote(values);
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
