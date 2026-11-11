# Handy Dandy Tags

Foundry VTT leaf module for **Handy Dandy Core**. GMs can attach tags to playlists, playlist tracks, scene notes, and journal entries, see those tags in the sidebar, filter each list with its own tag selector, optionally show playlist tags on tracks without duplicating storage, and rename or delete a tag across every document that stores it.

## Scope

- Playlists and tracks in the Playlists sidebar tab
- Scene notes in the Placeables Notes tab (`NoteTab`)
- Journal entries in the Journal sidebar tab (`JournalDirectory`)

Out of scope: journal pages, journal categories, Handy Dandy Map Notes, compendium documents, actors, items, and PF2E data.

## Requirements

- Foundry VTT 14.360+
- [Handy Dandy Core](https://github.com/MemelyPepeartly/handy-dandy-core) **1.17.11** or newer

## Development

```bash
npm ci
npx tsc --noEmit
npm run build
```

Built artifacts land in `dist/`. See [docs/development.md](docs/development.md) for architecture notes and a manual GM verification checklist.
