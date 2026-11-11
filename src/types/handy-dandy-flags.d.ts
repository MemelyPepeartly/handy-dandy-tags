export {};

declare module "fvtt-types/configuration" {
  interface FlagConfig {
    Playlist: {
      "handy-dandy-tags": {
        tags?: string[];
      };
    };
    PlaylistSound: {
      "handy-dandy-tags": {
        tags?: string[];
      };
    };
    Note: {
      "handy-dandy-tags": {
        tags?: string[];
      };
    };
  }
}
