# Development Guide

Handy Dandy Tags is a leaf module. It depends on Core for `game.handyDandy.core.registerTool` and the preserved `game.handyDandy.tags` namespace slot. It does not add scene controls.

## Data model

- Flag scope: module id `handy-dandy-tags`
- Flag key: `tags`
- Value: `string[]` (normalized, max 24 tags, max 32 characters each)

Playlist tags and track tags are independent; playlist tags are not inherited by tracks.

## Client settings

Three client-scoped filter settings (`playlistTagFilter`, `trackTagFilter`, `noteTagFilter`) store the active tag filter per list. Empty string means no filter.

## Build

```bash
npm ci
npx tsc --noEmit
npm run build
```

Expect `dist/handy-dandy-tags.js`, `dist/module.json`, `dist/templates/tag-editor.hbs`, and `dist/styles/tags.css`.

## Manual GM verification (Foundry world)

1. Enable Core 1.17.11+ and this module.
2. Tag a playlist, a track inside it, and a scene note; confirm chips appear in the Playlists tab and Notes placeables tab.
3. Filter each list with its own tag select; clear filters and confirm the built-in name search still works.
4. As a player, confirm chips are visible and Edit Tags is not offered.
5. Disable the module and confirm sidebars still render (stored flags remain on documents but are unused).
