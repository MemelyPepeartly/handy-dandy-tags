# Development Guide

Handy Dandy Tags is a leaf module. It depends on Core for `game.handyDandy.core.registerTool` and the preserved `game.handyDandy.tags` namespace slot. It does not add scene controls.

Requires Handy Dandy Core **1.17.11** (Core package version; tags ships as **1.17.12**).

## Data model

- Flag scope: module id `handy-dandy-tags`
- Flag key: `tags`
- Value: `string[]` (normalized, max 24 tags, max 32 characters each)

Playlist tags and track tags are independent unless the world setting `showPlaylistTagsOnTracks` is enabled. When it is on, tracks display and filter with the parent playlist’s stored tags merged at read time; the setting never writes those labels onto `PlaylistSound` flags.

## Settings

Four client-scoped filter settings (`playlistTagFilter`, `trackTagFilter`, `noteTagFilter`, `journalTagFilter`) store the active tag filter per sidebar list. Empty string means no filter.

One world setting: `showPlaylistTagsOnTracks` (Boolean, default `false`, config visible). When enabled, inherited playlist tags appear on track rows with distinct styling and participate in the track tag filter only as display-time merges.

Rename and delete everywhere update stored flags on every tagged playlist, track, note (all scenes), and journal entry via sequential `setTags` calls. The acting client’s filter settings are updated when they matched the old tag; stale unknown filter values are treated as no filter when applying.

## CI workflows

`.github/workflows/build.yml` and `main.yml` are byte-identical to the same files in Handy Dandy Core and must stay unedited.

## Build

```bash
npm ci
npx tsc --noEmit
npm run build
```

Expect `dist/handy-dandy-tags.js`, `dist/module.json` version `1.17.12`, `dist/templates/tag-editor.hbs`, and `dist/styles/tags.css`. Dist manifest still requires Core `1.17.11`, Foundry `verified` `14.370`, and has no `systems` entry.

## Manual GM verification (Foundry world)

This checklist was not run in the cloud build environment (no Foundry world available).

1. Tag a journal entry; chips show on that entry in the Journal sidebar. Journal pages and categories gain no tags and no Edit Tags item.
2. The journal tag select filters entry rows. Clearing it restores the list. The journal name search still works.
3. With `showPlaylistTagsOnTracks` off, tracks do not show the playlist’s tags. Turn it on: tracks show those tags with the inherited chip, the track filter matches them, and the track’s stored flag is unchanged (playlist tags are absent from the sound flag).
4. Remove on a track removes only a stored track tag. Inherited chips are not removable there.
5. Rename a tag from any document that stores it. Playlists, tracks, notes on non-viewed scenes, and journal entries that stored it show the new spelling. Inherited display follows the playlist flag without a second copy. A colliding tag on the same document dedupes. An empty or over-long name writes nothing. Renaming a tag to itself writes nothing.
6. Delete everywhere removes the stored tag from every document above and unsets the flag when the array is empty. Confirm is required. Remove still affects only the open document.
7. A player sees chips, including inherited ones when the setting is on, and does not see Edit Tags.
8. After a rename or delete, a stale filter value does not hide the whole list.
9. Disable the module: sidebars still render; flags remain.
