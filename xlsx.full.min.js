{
  "name": "oss-kaffe-team-grid",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node server.mjs",
    "build:netlify": "node scripts/build-netlify.mjs",
    "check": "node --check app.js && node --check server.mjs && node --check netlify/functions/_shared.mjs"
  },
  "dependencies": {
    "@netlify/blobs": "^10.7.9"
  },
  "engines": {
    "node": ">=20"
  }
}
