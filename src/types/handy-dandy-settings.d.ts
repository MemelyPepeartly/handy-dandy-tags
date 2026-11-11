export {};

declare module "fvtt-types/configuration" {
  interface SettingConfig {
    "handy-dandy-tags.playlistTagFilter": string;
    "handy-dandy-tags.trackTagFilter": string;
    "handy-dandy-tags.noteTagFilter": string;
    "handy-dandy-tags.journalTagFilter": string;
    "handy-dandy-tags.showPlaylistTagsOnTracks": boolean;
  }
}
