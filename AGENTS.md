# Handy Dandy Tags Agent Instructions

## Scope
- Applies to this repository only.
- Handy Dandy Tags is a system-agnostic leaf module and depends on Handy Dandy Core.

## Product Intent
- Own playlist, playlist track, and scene note tags in the Foundry sidebar.
- Store tags on document flags; expose filter controls beside the existing search.
- Do not tag journals, Map Notes, or other document types.

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

## Build and Verification
- `npm ci`
- `npx tsc --noEmit`
- `npm run build`

## Documentation
- Update `README.md` and `docs/development.md` when changing public behavior or settings.
