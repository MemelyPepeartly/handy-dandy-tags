import { MODULE_ID } from "../constants";

export const SETTING_PLAYLIST_FILTER = "playlistTagFilter";
export const SETTING_TRACK_FILTER = "trackTagFilter";
export const SETTING_NOTE_FILTER = "noteTagFilter";

const FILTER_SETTINGS = [
  SETTING_PLAYLIST_FILTER,
  SETTING_TRACK_FILTER,
  SETTING_NOTE_FILTER,
] as const;

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
}

export function getTagFilterSetting(key: typeof FILTER_SETTINGS[number]): string {
  return String((game as ReadyGame).settings.get(MODULE_ID, key) ?? "");
}

export async function setTagFilterSetting(
  key: typeof FILTER_SETTINGS[number],
  value: string,
): Promise<unknown> {
  return (game as ReadyGame).settings.set(MODULE_ID, key, value);
}
