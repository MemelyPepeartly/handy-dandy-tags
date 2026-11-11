# Handy Dandy Tags Agent Instructions

## Scope
- Applies to this repository only.
- Handy Dandy Tags is a system-agnostic leaf module and depends on Handy Dandy Core.

## Product Intent
- Own playlist, playlist track, scene note, and journal entry tags in the Foundry sidebar.
- Store tags on document flags; expose filter controls beside the existing search.
- Optionally show playlist tags on tracks when the world setting `showPlaylistTagsOnTracks` is enabled (default off); never write inherited tags onto tracks.
- GMs can rename or delete a tag everywhere it is stored via the tag editor and sequential `setTags` writes.
- Do not tag journal pages, journal categories, Map Notes, compendium documents, or other document types.

## Architecture
- Bootstrap and Core registration: `src/scripts/module.ts`
- Tag model: `src/scripts/tags/model.ts`
- Flag I/O and resolution: `src/scripts/tags/store.ts`
- Sidebar injection: `src/scripts/ui/directory.ts`
- Tag editor: `src/scripts/ui/tag-editor.ts`

## Guardrails
- Register into Core; do not recreate toolbar or scene-control plumbing.
- Use only documented Foundry V14 hooks and APIs from the module plan.
- Gate writes with `game.user.isGM` and `canUserModify(game.user, "update")`.
- `.github/workflows/build.yml` and `main.yml` already match Handy Dandy Core; do not edit them.

## Build and Verification
- `npm ci`
- `npx tsc --noEmit`
- `npm run build`

## Documentation
- Update `README.md` and `docs/development.md` when changing public behavior or settings.
