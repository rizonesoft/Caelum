/**
 * sync-manifest-version.js
 *
 * Reads the version from package.json and updates
 * the <Version> element in manifest.xml to match.
 *
 * Office manifest uses 4-segment versioning (e.g. 1.2.3.0),
 * so we append ".0" to the semver 3-segment version.
 *
 * Called automatically by the npm `version` lifecycle hook.
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const manifestPath = path.join(root, 'manifest.xml');

const semver = pkg.version; // e.g. "1.2.3"
const officeVersion = `${semver}.0`; // e.g. "1.2.3.0"

let manifest = fs.readFileSync(manifestPath, 'utf8');
manifest = manifest.replace(
  /<Version>[^<]+<\/Version>/,
  `<Version>${officeVersion}</Version>`,
);
fs.writeFileSync(manifestPath, manifest, 'utf8');

console.log(`✓ manifest.xml version updated to ${officeVersion}`);
