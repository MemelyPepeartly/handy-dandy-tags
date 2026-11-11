import {
  SETTING_NOTE_FILTER,
  SETTING_PLAYLIST_FILTER,
  SETTING_TRACK_FILTER,
  getTagFilterSetting,
  setTagFilterSetting,
} from "../setup/settings";
import {
  canEditTags,
  collectDatasetValues,
  documentsMatch,
  getTags,
  listHasTag,
  resolveDocumentFromElement,
  type TagDocument,
} from "../tags/store";
import { getTagEditor } from "./tag-editor";
import { sameTag } from "../tags/model";

const FILTERED_CLASS = "handy-dandy-tag-filtered";
const TAGS_ROOT_CLASS = "handy-dandy-tags";
const FILTER_ATTR = "data-handy-dandy-tags-filter";

type SidebarTab = {
  render: (options?: boolean | Record<string, unknown>) => Promise<unknown>;
  rendered: boolean;
};

type SidebarTabState = {
  application: SidebarTab;
  element: HTMLElement;
};

let lastPlaylistDirectory: SidebarTabState | null = null;

let lastNoteTab: SidebarTabState | null = null;

const boundSearchRoots = new WeakSet<HTMLElement>();

function removeInjectedNodes(root: HTMLElement): void {
  for (const node of root.querySelectorAll(`.${TAGS_ROOT_CLASS}, [${FILTER_ATTR}]`)) {
    node.remove();
  }
  for (const node of root.querySelectorAll(".handy-dandy-tags-filters")) {
    node.remove();
  }
}

function isOutermostRowForDocument(element: HTMLElement, document: TagDocument): boolean {
  const parent = element.parentElement;
  if (!parent) {
    return true;
  }
  const parentDocument = resolveDocumentFromElement(parent);
  return !(parentDocument && documentsMatch(parentDocument, document));
}

function enumerateRowElements(root: HTMLElement): Map<TagDocument, HTMLElement> {
  const map = new Map<TagDocument, HTMLElement>();
  const candidates = root.querySelectorAll<HTMLElement>("*");
  for (const element of candidates) {
    if (Object.keys(element.dataset).length === 0 && element.parentElement === root) {
      continue;
    }
    const values = collectDatasetValues(element);
    if (values.size === 0) {
      continue;
    }
    const document = resolveDocumentFromElement(element);
    if (!document || !isOutermostRowForDocument(element, document)) {
      continue;
    }
    if (!map.has(document)) {
      map.set(document, element);
    }
  }
  return map;
}

function buildChipRow(tagDocument: TagDocument): HTMLSpanElement {
  const row = globalThis.document.createElement("span");
  row.className = TAGS_ROOT_CLASS;

  for (const tag of getTags(tagDocument)) {
    const chip = globalThis.document.createElement("span");
    chip.className = "handy-dandy-tag";
    chip.textContent = tag;
    row.appendChild(chip);
  }

  if (canEditTags(tagDocument)) {
    const button = globalThis.document.createElement("button");
    button.type = "button";
    button.className = "handy-dandy-tags-edit";
    button.textContent = "Edit tags";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      void getTagEditor().openFor(tagDocument);
    });
    row.appendChild(button);
  }

  return row;
}

function sortedUniqueTags(tags: Iterable<string>): string[] {
  const unique = new Map<string, string>();
  for (const tag of tags) {
    const key = tag.toLocaleLowerCase();
    if (!unique.has(key)) {
      unique.set(key, tag);
    }
  }
  return [...unique.values()].sort((a, b) => a.localeCompare(b));
}

function collectPlaylistTags(): string[] {
  const tags: string[] = [];
  const playlists = (game as ReadyGame).playlists?.contents ?? [];
  for (const playlist of playlists) {
    tags.push(...getTags(playlist));
  }
  return sortedUniqueTags(tags);
}

function collectTrackTags(): string[] {
  const tags: string[] = [];
  const playlists = (game as ReadyGame).playlists?.contents ?? [];
  for (const playlist of playlists) {
    const sounds = playlist.getEmbeddedCollection("PlaylistSound");
    for (const sound of sounds.contents) {
      tags.push(...getTags(sound));
    }
  }
  return sortedUniqueTags(tags);
}

function collectNoteTags(): string[] {
  const scene = (game as ReadyGame).scenes?.viewed;
  if (!scene) {
    return [];
  }
  const tags: string[] = [];
  for (const note of scene.getEmbeddedCollection("Note").contents) {
    tags.push(...getTags(note));
  }
  return sortedUniqueTags(tags);
}

function buildFilterSelect(
  filterKey: typeof SETTING_PLAYLIST_FILTER | typeof SETTING_TRACK_FILTER | typeof SETTING_NOTE_FILTER,
  listAttr: "playlist" | "track" | "note",
  labelText: string,
  tagChoices: string[],
): HTMLElement {
  const wrapper = document.createElement("label");
  wrapper.textContent = labelText;

  const select = document.createElement("select");
  select.setAttribute(FILTER_ATTR, listAttr);
  select.dataset.handyDandyTagsFilter = listAttr;

  const allOption = document.createElement("option");
  allOption.value = "";
  allOption.textContent = "All";
  select.appendChild(allOption);

  const current = getTagFilterSetting(filterKey);
  for (const tag of tagChoices) {
    const option = document.createElement("option");
    option.value = tag;
    option.textContent = tag;
    if (current && sameTag(current, tag)) {
      option.selected = true;
    }
    select.appendChild(option);
  }

  if (current && !tagChoices.some((tag) => sameTag(tag, current))) {
    select.value = "";
  }

  select.addEventListener("change", () => {
    void setTagFilterSetting(filterKey, select.value).then(() => {
      if (listAttr === "note" && lastNoteTab) {
        applyNoteTabFilters(lastNoteTab.element);
      } else if (lastPlaylistDirectory) {
        applyPlaylistDirectoryFilters(lastPlaylistDirectory.element);
      }
    });
  });

  wrapper.appendChild(select);
  return wrapper;
}

function insertPlaylistFilters(element: HTMLElement): void {
  const bar = document.createElement("div");
  bar.className = "handy-dandy-tags-filters";
  bar.appendChild(buildFilterSelect(SETTING_PLAYLIST_FILTER, "playlist", "Playlist tag:", collectPlaylistTags()));
  bar.appendChild(buildFilterSelect(SETTING_TRACK_FILTER, "track", "Track tag:", collectTrackTags()));
  element.prepend(bar);
}

function insertNoteFilters(element: HTMLElement): void {
  const bar = document.createElement("div");
  bar.className = "handy-dandy-tags-filters";
  bar.appendChild(buildFilterSelect(SETTING_NOTE_FILTER, "note", "Note tag:", collectNoteTags()));
  element.prepend(bar);
}

function clearFilterClasses(root: HTMLElement): void {
  for (const node of root.querySelectorAll(`.${FILTERED_CLASS}`)) {
    node.classList.remove(FILTERED_CLASS);
  }
}

function isPlaylist(document: TagDocument): document is Playlist {
  return document instanceof Playlist;
}

function isPlaylistSound(document: TagDocument): document is PlaylistSound {
  return document instanceof PlaylistSound;
}

function isSceneNote(document: TagDocument): document is NoteDocument.Implementation {
  return document.documentName === "Note";
}

function applyPlaylistDirectoryFilters(element: HTMLElement): void {
  const rowMap = enumerateRowElements(element);
  clearFilterClasses(element);

  const playlistFilter = getTagFilterSetting(SETTING_PLAYLIST_FILTER);
  const trackFilter = getTagFilterSetting(SETTING_TRACK_FILTER);

  for (const [document, row] of rowMap) {
    if (isPlaylist(document)) {
      if (playlistFilter && !listHasTag(getTags(document), playlistFilter)) {
        row.classList.add(FILTERED_CLASS);
      }
      continue;
    }

    if (isPlaylistSound(document) && trackFilter && !listHasTag(getTags(document), trackFilter)) {
      row.classList.add(FILTERED_CLASS);
    }
  }
}

function applyNoteTabFilters(element: HTMLElement): void {
  const rowMap = enumerateRowElements(element);
  clearFilterClasses(element);

  const noteFilter = getTagFilterSetting(SETTING_NOTE_FILTER);
  if (!noteFilter) {
    return;
  }

  for (const [document, row] of rowMap) {
    if (isSceneNote(document)) {
      if (!listHasTag(getTags(document), noteFilter)) {
        row.classList.add(FILTERED_CLASS);
      }
    }
  }
}

function attachSearchListeners(element: HTMLElement, reapply: () => void): void {
  if (boundSearchRoots.has(element)) {
    return;
  }
  boundSearchRoots.add(element);
  const scheduleReapply = (event: Event): void => {
    if (!(event.target instanceof HTMLInputElement)) {
      return;
    }
    queueMicrotask(reapply);
  };
  element.addEventListener("keyup", scheduleReapply);
  element.addEventListener("input", scheduleReapply);
}

function injectChips(root: HTMLElement): void {
  const rowMap = enumerateRowElements(root);
  for (const [document, row] of rowMap) {
    if (row.querySelector(`.${TAGS_ROOT_CLASS}`)) {
      continue;
    }
    row.appendChild(buildChipRow(document));
  }
}

export function onRenderPlaylistDirectory(application: SidebarTab, element: HTMLElement): void {
  lastPlaylistDirectory = { application, element };
  getTagEditor().setSidebarTabs(application, lastNoteTab?.application ?? null);

  removeInjectedNodes(element);
  insertPlaylistFilters(element);
  injectChips(element);
  applyPlaylistDirectoryFilters(element);
  attachSearchListeners(element, () => {
    applyPlaylistDirectoryFilters(element);
  });
}

export function onRenderNoteTab(application: SidebarTab, element: HTMLElement): void {
  lastNoteTab = { application, element };
  getTagEditor().setSidebarTabs(lastPlaylistDirectory?.application ?? null, application);

  removeInjectedNodes(element);
  insertNoteFilters(element);
  injectChips(element);
  applyNoteTabFilters(element);
  attachSearchListeners(element, () => {
    applyNoteTabFilters(element);
  });
}

export function openEditorForTarget(target: HTMLElement): void {
  const document = resolveDocumentFromElement(target);
  if (!document || !canEditTags(document)) {
    return;
  }
  void getTagEditor().openFor(document);
}

export function buildEditTagsContextMenuEntry(): foundry.ContextMenuEntry {
  return {
    label: "Edit Tags",
    icon: "fa-solid fa-tags",
    visible: (target: HTMLElement) => {
      const resolved = resolveDocumentFromElement(target);
      return resolved !== null && canEditTags(resolved);
    },
    onClick: (_event: PointerEvent, target: HTMLElement) => {
      const resolved = resolveDocumentFromElement(target);
      if (resolved && canEditTags(resolved)) {
        void getTagEditor().openFor(resolved);
      }
    },
  };
}
