import { TEMPLATE_PATH } from "../constants";
import {
  deleteTagEverywhere,
  getInheritedTags,
  getTags,
  renameTagEverywhere,
  setTags,
  type TagDocument,
} from "../tags/store";
import { normalizeTag, normalizeTagList } from "../tags/model";

type EditorTagRow = {
  tag: string;
  isRenaming: boolean;
  pendingDeleteConfirm: boolean;
};

type EditorContext = {
  documentName: string;
  tags: EditorTagRow[];
  inheritedPlaylistTags: string[];
  showInheritedLine: boolean;
};

type SidebarTab = {
  render: (options?: boolean | Record<string, unknown>) => Promise<unknown>;
  rendered: boolean;
};

const ApplicationV2 = foundry.applications.api.ApplicationV2;
const TagEditorBase = (
  foundry.applications.api as unknown as {
    HandlebarsApplicationMixin: (base: typeof ApplicationV2) => typeof ApplicationV2;
  }
).HandlebarsApplicationMixin(ApplicationV2);

export class TagEditor extends TagEditorBase {
  #document: TagDocument | null = null;
  #playlistTab: SidebarTab | null = null;
  #noteTab: SidebarTab | null = null;
  #journalTab: SidebarTab | null = null;
  #renamingTag: string | null = null;
  #pendingDelete: string | null = null;
  #catalogBusy = false;

  static DEFAULT_OPTIONS = {
    id: "handy-dandy-tag-editor",
    classes: ["handy-dandy", "handy-dandy-tags", "handy-dandy-tag-editor"],
    tag: "form",
    position: {
      width: 420,
    },
    window: {
      title: "Edit Tags",
      icon: "fa-solid fa-tags",
    },
    actions: {
      addTag: TagEditor.#onAddTag,
      removeTag: TagEditor.#onRemoveTag,
      startRename: TagEditor.#onStartRename,
      saveRename: TagEditor.#onSaveRename,
      cancelRename: TagEditor.#onCancelRename,
      deleteEverywhere: TagEditor.#onDeleteEverywhere,
    },
  };

  static PARTS = {
    body: {
      template: `${TEMPLATE_PATH}/tag-editor.hbs`,
    },
  };

  setSidebarTabs(playlistTab: SidebarTab | null, noteTab: SidebarTab | null, journalTab: SidebarTab | null): void {
    this.#playlistTab = playlistTab;
    this.#noteTab = noteTab;
    this.#journalTab = journalTab;
  }

  async openFor(document: TagDocument): Promise<void> {
    const user = (game as ReadyGame).user;
    if (!user?.isGM) {
      return;
    }
    this.#document = document;
    this.#renamingTag = null;
    this.#pendingDelete = null;
    await this.render({ force: true });
  }

  async #refreshAllSidebars(): Promise<void> {
    const tabs = [this.#playlistTab, this.#noteTab, this.#journalTab];
    for (const tab of tabs) {
      if (tab?.rendered) {
        await tab.render();
      }
    }
  }

  async #refreshSidebarForDocument(document: TagDocument): Promise<void> {
    if (
      document.documentName === "Playlist" ||
      document.documentName === "PlaylistSound" ||
      document.documentName === "Note" ||
      document.documentName === "JournalEntry"
    ) {
      await this.#refreshAllSidebars();
    }
  }

  // @ts-expect-error HandlebarsApplicationMixin uses the template data object as the render context.
  protected override async _prepareContext(
    _options: Partial<foundry.applications.api.ApplicationV2.RenderOptions>,
  ): Promise<EditorContext> {
    const document = this.#document;
    const inheritedPlaylistTags =
      document instanceof PlaylistSound ? getInheritedTags(document) : [];
    const stored = document ? getTags(document) : [];
    return {
      documentName: document?.name ?? "Unknown",
      tags: stored.map((tag) => ({
        tag,
        isRenaming: this.#renamingTag !== null && tag === this.#renamingTag,
        pendingDeleteConfirm: this.#pendingDelete !== null && tag === this.#pendingDelete,
      })),
      inheritedPlaylistTags,
      showInheritedLine: inheritedPlaylistTags.length > 0,
    };
  }

  static async #onAddTag(this: TagEditor, event: PointerEvent, target: HTMLElement): Promise<void> {
    event.preventDefault();
    const document = this.#document;
    const user = (game as ReadyGame).user;
    if (!document || !user?.isGM) {
      return;
    }

    const root = target.closest("form") ?? this.element;
    const input = root?.querySelector<HTMLInputElement>('input[name="newTag"]');
    const raw = input?.value ?? "";
    const tag = normalizeTag(raw);
    if (!tag) {
      return;
    }

    const next = normalizeTagList([...getTags(document), tag]);
    await setTags(document, next);
    await this.#refreshSidebarForDocument(document);
    await this.close();
  }

  static async #onRemoveTag(this: TagEditor, event: PointerEvent, target: HTMLElement): Promise<void> {
    event.preventDefault();
    const document = this.#document;
    const user = (game as ReadyGame).user;
    if (!document || !user?.isGM) {
      return;
    }

    const removeTag = target.dataset.tag ?? target.closest<HTMLElement>("[data-tag]")?.dataset.tag;
    if (!removeTag) {
      return;
    }

    this.#pendingDelete = null;
    this.#renamingTag = null;

    const next = getTags(document).filter((tag) => tag !== removeTag);
    await setTags(document, next);
    await this.#refreshSidebarForDocument(document);
    await this.close();
  }

  static async #onStartRename(this: TagEditor, event: PointerEvent, target: HTMLElement): Promise<void> {
    event.preventDefault();
    if (this.#catalogBusy) {
      return;
    }
    const tag = target.dataset.tag ?? target.closest<HTMLElement>("[data-tag]")?.dataset.tag;
    if (!tag) {
      return;
    }
    this.#pendingDelete = null;
    this.#renamingTag = tag;
    await this.render();
  }

  static async #onCancelRename(this: TagEditor, event: PointerEvent): Promise<void> {
    event.preventDefault();
    this.#renamingTag = null;
    await this.render();
  }

  static async #onSaveRename(this: TagEditor, event: PointerEvent, target: HTMLElement): Promise<void> {
    event.preventDefault();
    if (this.#catalogBusy || !this.#renamingTag) {
      return;
    }
    const fromTag = this.#renamingTag;
    const root = target.closest("form") ?? this.element;
    const input = root?.querySelector<HTMLInputElement>(`input[name="renameTag-${CSS.escape(fromTag)}"]`);
    const raw = input?.value ?? "";
    const toTag = normalizeTag(raw);
    if (!toTag) {
      ui.notifications?.error("Enter a valid tag name.");
      return;
    }

    this.#catalogBusy = true;
    try {
      await renameTagEverywhere(fromTag, toTag);
      this.#renamingTag = null;
      this.#pendingDelete = null;
      await this.#refreshAllSidebars();
      await this.render({ force: true });
    } finally {
      this.#catalogBusy = false;
    }
  }

  static async #onDeleteEverywhere(this: TagEditor, event: PointerEvent, target: HTMLElement): Promise<void> {
    event.preventDefault();
    if (this.#catalogBusy) {
      return;
    }
    const tag = target.dataset.tag ?? target.closest<HTMLElement>("[data-tag]")?.dataset.tag;
    if (!tag) {
      return;
    }

    this.#renamingTag = null;

    if (this.#pendingDelete !== tag) {
      this.#pendingDelete = tag;
      await this.render();
      return;
    }

    this.#catalogBusy = true;
    try {
      await deleteTagEverywhere(tag);
      this.#pendingDelete = null;
      await this.#refreshAllSidebars();
      await this.render({ force: true });
    } finally {
      this.#catalogBusy = false;
    }
  }
}

let sharedEditor: TagEditor | null = null;

export function getTagEditor(): TagEditor {
  if (!sharedEditor) {
    sharedEditor = new TagEditor();
  }
  return sharedEditor;
}
