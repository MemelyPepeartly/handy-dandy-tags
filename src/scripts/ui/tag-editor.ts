import { TEMPLATE_PATH } from "../constants";
import { getTags, setTags, type TagDocument } from "../tags/store";
import { normalizeTag, normalizeTagList } from "../tags/model";

type EditorContext = {
  documentName: string;
  tags: string[];
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

  static DEFAULT_OPTIONS = {
    id: "handy-dandy-tag-editor",
    classes: ["handy-dandy", "handy-dandy-tags", "handy-dandy-tag-editor"],
    tag: "form",
    position: {
      width: 360,
    },
    window: {
      title: "Edit Tags",
      icon: "fa-solid fa-tags",
    },
    actions: {
      addTag: TagEditor.#onAddTag,
      removeTag: TagEditor.#onRemoveTag,
    },
  };

  static PARTS = {
    body: {
      template: `${TEMPLATE_PATH}/tag-editor.hbs`,
    },
  };

  setSidebarTabs(playlistTab: SidebarTab | null, noteTab: SidebarTab | null): void {
    this.#playlistTab = playlistTab;
    this.#noteTab = noteTab;
  }

  async openFor(document: TagDocument): Promise<void> {
    const user = (game as ReadyGame).user;
    if (!user?.isGM) {
      return;
    }
    this.#document = document;
    await this.render({ force: true });
  }

  async #refreshSidebarForDocument(document: TagDocument): Promise<void> {
    if (document.documentName === "Playlist" || document.documentName === "PlaylistSound") {
      if (this.#playlistTab?.rendered) {
        await this.#playlistTab.render();
      }
      return;
    }
    if (document.documentName === "Note") {
      if (this.#noteTab?.rendered) {
        await this.#noteTab.render();
      }
    }
  }

  // @ts-expect-error HandlebarsApplicationMixin uses the template data object as the render context.
  protected override async _prepareContext(
    _options: Partial<foundry.applications.api.ApplicationV2.RenderOptions>,
  ): Promise<EditorContext> {
    const document = this.#document;
    return {
      documentName: document?.name ?? "Unknown",
      tags: document ? getTags(document) : [],
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

    const next = getTags(document).filter((tag) => tag !== removeTag);
    await setTags(document, next);
    await this.#refreshSidebarForDocument(document);
    await this.close();
  }
}

let sharedEditor: TagEditor | null = null;

export function getTagEditor(): TagEditor {
  if (!sharedEditor) {
    sharedEditor = new TagEditor();
  }
  return sharedEditor;
}
