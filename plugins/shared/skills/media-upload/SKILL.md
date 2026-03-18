---
name: media-upload
description: Upload media files (video, images, GIFs) to Bunny CDN or Vimeo. Use when a skill needs to publish rendered videos, screenshots, or other media to a permanent URL. Provides three upload functions for different platforms and use cases. Triggers on "upload video", "publish to vimeo", "upload to bunny", "publish media", or when another skill needs media hosting.
---

# Media Upload

Upload media files to Bunny CDN (video streaming + edge storage) or Vimeo. Zero npm dependencies — uses `fetch` directly.

## Setup

```bash
./secrets/setup.sh --skill media-upload
```

This pulls credentials from the "Media Upload" 1Password item into `~/.claude/settings.json`.

## Platform routing

| Use case | Function | Platform | When to use |
|---|---|---|---|
| Internal video (QA, demos) | `uploadToBunnyStream()` | Bunny Stream | Team-only content, cheapest |
| Customer-facing video (marketing, docs) | `uploadToVimeo()` | Vimeo | Public content, familiar URLs |
| Images, GIFs, static files | `uploadToBunnyStorage()` | Bunny Edge Storage | PR screenshots, thumbnails, any file needing a CDN URL |

## Functions

All functions are in `lib/upload.cjs`. Import via:

```javascript
const { uploadToVimeo, uploadToBunnyStream, uploadToBunnyStorage } = require('<path-to-skill>/lib/upload.cjs');
```

### uploadToVimeo(filePath, options?)

Uploads video to Vimeo using the tus resumable upload protocol.

**Env vars:** `VIMEO_ACCESS_TOKEN`
**Accepts:** MP4, WebM
**Options:** `{ name, description, privacy: 'unlisted'|'anybody'|'nobody'|'password', password }`
**Returns:** `{ videoId, url, embedUrl, uri }`

### uploadToBunnyStream(filePath, options?)

Uploads video to Bunny Stream for internal hosting.

**Env vars:** `BUNNY_STREAM_API_KEY`, `BUNNY_STREAM_LIBRARY_ID`
**Accepts:** MP4, WebM (VP8 explicitly supported)
**Options:** `{ name, collectionId, thumbnailTime }`
**Returns:** `{ videoId, url, embedUrl, directPlayUrl, thumbnailUrl }`

### uploadToBunnyStorage(filePath, remotePath, options?)

Uploads any file to Bunny Edge Storage CDN.

**Env vars:** `BUNNY_STORAGE_API_KEY`, `BUNNY_STORAGE_ZONE_NAME`, `BUNNY_STORAGE_HOSTNAME`
**Options:** `{ region }` — storage region prefix (e.g., 'ny')
**Returns:** `{ url, storagePath, size }`

## Env vars reference

| Var | Platform | Required for |
|-----|----------|-------------|
| `VIMEO_ACCESS_TOKEN` | Vimeo | `uploadToVimeo` |
| `BUNNY_STREAM_API_KEY` | Bunny Stream | `uploadToBunnyStream` |
| `BUNNY_STREAM_LIBRARY_ID` | Bunny Stream | `uploadToBunnyStream` |
| `BUNNY_STORAGE_API_KEY` | Bunny Edge Storage | `uploadToBunnyStorage` |
| `BUNNY_STORAGE_ZONE_NAME` | Bunny Edge Storage | `uploadToBunnyStorage` |
| `BUNNY_STORAGE_HOSTNAME` | Bunny Edge Storage | `uploadToBunnyStorage` |

Each function validates its required env vars and throws a descriptive error if missing.
