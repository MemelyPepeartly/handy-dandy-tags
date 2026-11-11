export {};

declare global {
  namespace foundry {
    interface ContextMenuEntry {
      label: string;
      icon?: string;
      onClick?: (event: PointerEvent, target: HTMLElement) => unknown;
      visible?: boolean | ((target: HTMLElement) => boolean);
    }
  }
}

declare namespace foundry.applications.handlebars {
  function loadTemplates(paths: string[] | Record<string, string>): Promise<void>;
}
