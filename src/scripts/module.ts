import { CONSTANTS, TEMPLATE_PATH } from "./constants";
import { registerSettings } from "./setup/settings";
import { getTags, normalizeTag, setTags } from "./tags/store";
import { buildEditTagsContextMenuEntry, onRenderNoteTab, onRenderPlaylistDirectory } from "./ui/directory";

interface HandyDandyToolRegistration {
  id: string;
  title: string;
  icon: string;
  description: string;
  location: string;
  onClick?: () => void | Promise<void>;
  buttonLabel?: string;
  buttonIcon?: string;
  showInHandyGroup?: boolean;
}

interface HandyDandyCoreApi {
  registerTool: (tool: HandyDandyToolRegistration) => void;
}

export interface HandyDandyTagsApi {
  getTags: typeof getTags;
  setTags: typeof setTags;
  normalizeTag: typeof normalizeTag;
}

function requireHandyDandyCore(): NonNullable<ReadyGame["handyDandy"]> {
  const namespace = (game as ReadyGame).handyDandy;
  if (!namespace?.core) {
    ui.notifications?.error(`${CONSTANTS.MODULE_NAME} requires Handy Dandy Core to be installed and active.`);
    throw new Error(`${CONSTANTS.MODULE_NAME} requires Handy Dandy Core.`);
  }
  return namespace;
}

const registerCustomHook = Hooks.on.bind(Hooks) as (
  hook: string,
  fn: (...args: unknown[]) => void,
) => number;

function registerRenderHooks(): void {
  Hooks.on("renderPlaylistDirectory", (application, element) => {
    onRenderPlaylistDirectory(application as Parameters<typeof onRenderPlaylistDirectory>[0], element);
  });

  registerCustomHook("renderNoteTab", (application, element) => {
    if (application && element instanceof HTMLElement) {
      onRenderNoteTab(application as Parameters<typeof onRenderNoteTab>[0], element);
    }
  });
}

function registerContextMenuHooks(): void {
  registerCustomHook("getPlaylistContextOptions", (_application, menuItems) => {
    if (Array.isArray(menuItems)) {
      menuItems.push(buildEditTagsContextMenuEntry());
    }
  });

  registerCustomHook("getPlaylistSoundContextOptions", (_application, menuItems) => {
    if (Array.isArray(menuItems)) {
      menuItems.push(buildEditTagsContextMenuEntry());
    }
  });

  registerCustomHook("getNotePlaceableContextOptions", (_application, menuItems) => {
    if (Array.isArray(menuItems)) {
      menuItems.push(buildEditTagsContextMenuEntry());
    }
  });
}

Hooks.once("init", () => {
  console.log(`${CONSTANTS.MODULE_NAME} | init`);
  registerSettings();
  void foundry.applications.handlebars.loadTemplates([`${TEMPLATE_PATH}/tag-editor.hbs`]);
  registerRenderHooks();
  registerContextMenuHooks();
});

Hooks.once("setup", () => {
  const namespace = requireHandyDandyCore();
  namespace.tags = {
    getTags,
    setTags,
    normalizeTag,
  };

  namespace.core.registerTool({
    id: "tags",
    title: "Playlist, Track, and Note Tags",
    icon: "fa-solid fa-tags",
    description:
      "GMs can tag playlists, individual tracks, and scene notes, then filter each sidebar list with its own tag selector.",
    location: "Playlists sidebar tab and Placeables Notes tab",
    showInHandyGroup: false,
  });
});
