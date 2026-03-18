'use strict';

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Video Upload — Vimeo (customer-facing: docs, marketing)
// Uses Vimeo's tus-based resumable upload API directly (no SDK dependency).
// ---------------------------------------------------------------------------

/**
 * Upload a video file to Vimeo using the tus resumable upload protocol.
 * Requires env vars: VIMEO_CLIENT_ID, VIMEO_CLIENT_SECRET, VIMEO_ACCESS_TOKEN.
 * @param {string} filePath - Path to video file (WebM or MP4)
 * @param {Object} [options] - { name, description, privacy: 'unlisted'|'anybody'|'nobody'|'password', password }
 * @returns {Promise<Object>} { videoId, url, embedUrl, uri }
 */
async function uploadToVimeo(filePath, options = {}) {
  const accessToken = process.env.VIMEO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error(
      'Vimeo upload requires VIMEO_ACCESS_TOKEN env var. ' +
      'Generate a Personal Access Token at https://developer.vimeo.com/apps'
    );
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`Video file not found: ${filePath}`);
  }

  const fileSize = fs.statSync(filePath).size;
  const fileName = path.basename(filePath);

  // Step 1: Create the video and get a tus upload link
  const createBody = {
    upload: {
      approach: 'tus',
      size: fileSize
    },
    name: options.name || `Upload - ${new Date().toISOString().slice(0, 19)}`,
    description: options.description || '',
    privacy: { view: options.privacy || 'unlisted' }
  };

  if (options.privacy === 'password' && options.password) {
    createBody.password = options.password;
  }

  const createRes = await fetch('https://api.vimeo.com/me/videos', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.vimeo.*+json;version=3.4'
    },
    body: JSON.stringify(createBody)
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Vimeo: failed to create video (${createRes.status}): ${errText}`);
  }

  const video = await createRes.json();
  const uploadLink = video.upload.upload_link;
  const uri = video.uri;
  const videoId = uri.split('/').pop();

  // Step 2: Upload the file via tus PATCH
  const fileBuffer = fs.readFileSync(filePath);
  console.log(`Vimeo: uploading ${(fileBuffer.length / 1024 / 1024).toFixed(1)} MB...`);

  const uploadRes = await fetch(uploadLink, {
    method: 'PATCH',
    headers: {
      'Tus-Resumable': '1.0.0',
      'Upload-Offset': '0',
      'Content-Type': 'application/offset+octet-stream'
    },
    body: fileBuffer
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Vimeo: upload failed (${uploadRes.status}): ${errText}`);
  }

  console.log(`Vimeo: upload complete. URL: https://vimeo.com/${videoId}`);

  return {
    videoId,
    url: `https://vimeo.com/${videoId}`,
    embedUrl: `https://player.vimeo.com/video/${videoId}`,
    uri
  };
}

// ---------------------------------------------------------------------------
// Video Upload — Bunny Stream (internal: team demos, QA recordings)
// ---------------------------------------------------------------------------

/**
 * Upload a video file to Bunny Stream.
 * Requires env vars: BUNNY_STREAM_API_KEY, BUNNY_STREAM_LIBRARY_ID.
 * @param {string} filePath - Path to video file (WebM or MP4)
 * @param {Object} [options] - { name, collectionId, thumbnailTime }
 * @returns {Promise<Object>} { videoId, url, embedUrl, directPlayUrl, thumbnailUrl }
 */
async function uploadToBunnyStream(filePath, options = {}) {
  const apiKey = process.env.BUNNY_STREAM_API_KEY;
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;

  if (!apiKey || !libraryId) {
    throw new Error(
      'Bunny Stream upload requires BUNNY_STREAM_API_KEY and BUNNY_STREAM_LIBRARY_ID env vars. ' +
      'Get these from https://dash.bunny.net/stream'
    );
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`Video file not found: ${filePath}`);
  }

  // Step 1: Create video object
  const createBody = {
    title: options.name || `Upload - ${new Date().toISOString().slice(0, 19)}`
  };
  if (options.collectionId) createBody.collectionId = options.collectionId;
  if (options.thumbnailTime != null) createBody.thumbnailTime = options.thumbnailTime;

  const createRes = await fetch(
    `https://video.bunnycdn.com/library/${libraryId}/videos`,
    {
      method: 'POST',
      headers: {
        'AccessKey': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(createBody)
    }
  );

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Bunny Stream: failed to create video (${createRes.status}): ${errText}`);
  }

  const video = await createRes.json();
  const videoId = video.guid;

  // Step 2: Upload binary
  const fileBuffer = fs.readFileSync(filePath);
  console.log(`Bunny Stream: uploading ${(fileBuffer.length / 1024 / 1024).toFixed(1)} MB...`);

  const uploadRes = await fetch(
    `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`,
    {
      method: 'PUT',
      headers: { 'AccessKey': apiKey },
      body: fileBuffer
    }
  );

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Bunny Stream: upload failed (${uploadRes.status}): ${errText}`);
  }

  const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`;
  console.log(`Bunny Stream: upload complete. Player: ${embedUrl}`);

  return {
    videoId,
    url: `https://iframe.mediadelivery.net/play/${libraryId}/${videoId}`,
    embedUrl,
    directPlayUrl: `https://video.bunnycdn.com/play/${libraryId}/${videoId}`,
    thumbnailUrl: `https://${video.pullZoneUrl || 'vz-cdn.net'}/${videoId}/thumbnail.jpg`
  };
}

// ---------------------------------------------------------------------------
// File Upload — Bunny Edge Storage (images, GIFs, any static file)
// ---------------------------------------------------------------------------

/**
 * Upload any file to Bunny Edge Storage and return a permanent CDN URL.
 * Requires: BUNNY_STORAGE_API_KEY, BUNNY_STORAGE_ZONE_NAME, BUNNY_STORAGE_HOSTNAME env vars.
 * @param {string} filePath - Local file to upload
 * @param {string} remotePath - Path within the storage zone (e.g., "pr-123/dashboard-before.png")
 * @param {Object} [options] - { region: '' } — storage region prefix (e.g., 'ny' for New York)
 * @returns {Promise<Object>} { url, storagePath, size }
 */
async function uploadToBunnyStorage(filePath, remotePath, options = {}) {
  const apiKey = process.env.BUNNY_STORAGE_API_KEY;
  const zoneName = process.env.BUNNY_STORAGE_ZONE_NAME;
  const cdnHostname = process.env.BUNNY_STORAGE_HOSTNAME;

  if (!apiKey || !zoneName || !cdnHostname) {
    throw new Error(
      'Bunny Storage upload requires BUNNY_STORAGE_API_KEY, BUNNY_STORAGE_ZONE_NAME, and BUNNY_STORAGE_HOSTNAME env vars. ' +
      'Set up a Storage Zone + Pull Zone at https://dash.bunny.net/storage'
    );
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const region = options.region || '';
  const endpoint = region
    ? `https://${region}.storage.bunnycdn.com`
    : 'https://storage.bunnycdn.com';

  const fileBuffer = fs.readFileSync(filePath);
  console.log(`Bunny Storage: uploading ${(fileBuffer.length / 1024 / 1024).toFixed(1)} MB → ${remotePath}`);

  const res = await fetch(
    `${endpoint}/${zoneName}/${remotePath}`,
    {
      method: 'PUT',
      headers: { 'AccessKey': apiKey },
      body: fileBuffer
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Bunny Storage: upload failed (${res.status}): ${errText}`);
  }

  const url = `https://${cdnHostname}/${remotePath}`;
  console.log(`Bunny Storage: upload complete. URL: ${url}`);

  return {
    url,
    storagePath: `${zoneName}/${remotePath}`,
    size: fileBuffer.length
  };
}

module.exports = {
  uploadToVimeo,
  uploadToBunnyStream,
  uploadToBunnyStorage
};
