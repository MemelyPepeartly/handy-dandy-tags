import { MODULE_ID } from "../constants";

export const SETTING_PLAYLIST_FILTER = "playlistTagFilter";
export const SETTING_TRACK_FILTER = "trackTagFilter";
export const SETTING_NOTE_FILTER = "noteTagFilter";
export const SETTING_JOURNAL_FILTER = "journalTagFilter";
export const SETTING_SHOW_PLAYLIST_TAGS_ON_TRACKS = "showPlaylistTagsOnTracks";

const FILTER_SETTINGS = [
  SETTING_PLAYLIST_FILTER,
  SETTING_TRACK_FILTER,
  SETTING_NOTE_FILTER,
  SETTING_JOURNAL_FILTER,
] as const;

export type TagFilterSettingKey = (typeof FILTER_SETTINGS)[number];

let showPlaylistTagsOnTracksListener: (() => void) | null = null;

export function setShowPlaylistTagsOnTracksListener(listener: () => void): void {
  showPlaylistTagsOnTracksListener = listener;
}

export function registerSettings(): void {
  const currentGame = game as InitGame;
  for (const key of FILTER_SETTINGS) {
    currentGame.settings?.register(MODULE_ID, key, {
      name: key,
      scope: "client",
      config: false,
      type: String,
      default: "",
    });
  }

  currentGame.settings?.register(MODULE_ID, SETTING_SHOW_PLAYLIST_TAGS_ON_TRACKS, {
    name: "Show playlist tags on tracks",
    hint: "Playlist tags are shown and filtered on tracks and are not copied onto the tracks.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    onChange: () => {
      showPlaylistTagsOnTracksListener?.();
    },
  });
}

export function getTagFilterSetting(key: TagFilterSettingKey): string {
  return String((game as ReadyGame).settings.get(MODULE_ID, key) ?? "");
}

export async function setTagFilterSetting(key: TagFilterSettingKey, value: string): Promise<unknown> {
  return (game as ReadyGame).settings.set(MODULE_ID, key, value);
}

export function getShowPlaylistTagsOnTracks(): boolean {
  return Boolean((game as ReadyGame).settings.get(MODULE_ID, SETTING_SHOW_PLAYLIST_TAGS_ON_TRACKS));
}

export { FILTER_SETTINGS };
