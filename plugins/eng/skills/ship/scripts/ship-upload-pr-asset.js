#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { uploadToBunnyStorage } = require('../../browser/lib/helpers');

function usage(exitCode = 0) {
  console.error(`Usage: ship-upload-pr-asset.js --file <path> [--file <path> ...] [--remote-prefix <prefix>] [--region <region>] [--format markdown|json]

Uploads one or more existing PR assets to Bunny Edge Storage and prints either
Markdown image snippets or JSON metadata. This is for upload only. Capture can
come from Playwright, macOS screenshots, or any other source.`);
  process.exit(exitCode);
}

function sanitizeSegment(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

function parseArgs(argv) {
  const result = { files: [], format: 'markdown' };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case '--file':
        result.files.push(argv[++i]);
        break;
      case '--remote-prefix':
        result.remotePrefix = argv[++i];
        break;
      case '--region':
        result.region = argv[++i];
        break;
      case '--format':
        result.format = argv[++i];
        break;
      case '-h':
      case '--help':
        usage(0);
        break;
      default:
        console.error(`Unknown argument: ${arg}`);
        usage(1);
    }
  }

  if (result.files.length === 0) {
    console.error('At least one --file is required.');
    usage(1);
  }

  if (!['markdown', 'json'].includes(result.format)) {
    console.error(`Unsupported --format value: ${result.format}`);
    usage(1);
  }

  return result;
}

function repoInfo() {
  const repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
  const branch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
    cwd: repoRoot,
    encoding: 'utf8',
  }).trim();
  return { repoRoot, branch };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { repoRoot, branch } = repoInfo();
  const repoName = path.basename(repoRoot);
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const remotePrefix =
    args.remotePrefix ||
    `ship-assets/${sanitizeSegment(repoName)}/${sanitizeSegment(branch)}`;

  const uploads = [];
  for (const inputPath of args.files) {
    const absolutePath = path.resolve(inputPath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Asset not found: ${absolutePath}`);
    }

    const fileName = path.basename(absolutePath);
    const remotePath = `${remotePrefix}/${timestamp}-${sanitizeSegment(fileName)}`;
    const uploadResult = await uploadToBunnyStorage(
      absolutePath,
      remotePath,
      args.region ? { region: args.region } : {}
    );

    uploads.push({
      file: absolutePath,
      remotePath,
      url: uploadResult.url,
      markdown: `![${fileName}](${uploadResult.url})`,
    });
  }

  if (args.format === 'json') {
    console.log(JSON.stringify(uploads, null, 2));
    return;
  }

  for (const upload of uploads) {
    console.log(upload.markdown);
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
