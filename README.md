# Handy Dandy Tags

Foundry VTT leaf module for **Handy Dandy Core**. GMs can attach tags to playlists, individual playlist tracks, and scene notes (NoteDocument in the Placeables Notes tab), see those tags at a glance in the sidebar, and filter each list with its own tag selector.

## Scope

- Playlists and tracks in the Playlists sidebar tab
- Scene notes in the Placeables Notes tab (`NoteTab`)

Out of scope: journal entries, Handy Dandy Map Notes, actors, items, and PF2E data.

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
