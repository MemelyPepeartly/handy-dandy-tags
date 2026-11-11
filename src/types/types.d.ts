export {};

declare global {
  interface ReadyGame {
    handyDandy?: {
      openRouterSdk: unknown | null;
      openRouterClient: unknown | null;
      refreshAIClient: () => void;
      generation: Record<string, unknown>;
      applications: Record<string, unknown>;
      dev: Record<string, unknown>;
      flows: Record<string, unknown>;
      tags: {
        getTags: (document: Playlist | PlaylistSound | NoteDocument.Implementation | JournalEntry) => string[];
        setTags: (
          document: Playlist | PlaylistSound | NoteDocument.Implementation | JournalEntry,
          tags: readonly string[],
        ) => Promise<void>;
        normalizeTag: (value: string) => string | null;
      };
      core: {
        registerTool: (tool: Record<string, unknown>) => void;
      };
    };
  }
}

declare module "#configuration" {
  namespace Hooks {
    interface HookConfig {
      renderPlaylistDirectory: (
        application: foundry.applications.sidebar.tabs.PlaylistDirectory.Any,
        element: HTMLElement,
        context: unknown,
        options: unknown,
      ) => void;
      renderNoteTab: (application: unknown, element: HTMLElement, context: unknown, options: unknown) => void;
      renderJournalDirectory: (
        application: foundry.applications.sidebar.tabs.JournalDirectory.Any,
        element: HTMLElement,
        context: unknown,
        options: unknown,
      ) => void;
      getPlaylistContextOptions: (
        application: foundry.applications.sidebar.tabs.PlaylistDirectory.Any,
        menuItems: foundry.ContextMenuEntry[],
      ) => void;
      getPlaylistSoundContextOptions: (
        application: foundry.applications.sidebar.tabs.PlaylistDirectory.Any,
        menuItems: foundry.ContextMenuEntry[],
      ) => void;
      getNotePlaceableContextOptions: (application: unknown, menuItems: foundry.ContextMenuEntry[]) => void;
      getJournalEntryContextOptions: (
        application: foundry.applications.sidebar.tabs.JournalDirectory.Any,
        menuItems: foundry.ContextMenuEntry[],
      ) => void;
    }
  }
}

interface AssumeGameReady extends ReadyGame {}

export { AssumeGameReady };
