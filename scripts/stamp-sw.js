// Stamps public/sw.js with a fresh CACHE_NAME on every production build,
// so deployed clients bust their old service-worker cache automatically.
//
// Uses Next.js's generated .next/BUILD_ID as the version source when
// available (stable per-build hash), falling back to a timestamp.
//
// Run automatically via the "postbuild" npm script.

const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '..')
const SW_PATH = path.join(ROOT, 'public', 'sw.js')
const BUILD_ID_PATH = path.join(ROOT, '.next', 'BUILD_ID')

function getBuildVersion() {
  try {
    const buildId = fs.readFileSync(BUILD_ID_PATH, 'utf8').trim()
    if (buildId) return buildId
  } catch {
    // .next/BUILD_ID not found — fall back below
  }
  return Date.now().toString(36)
}

function main() {
  if (!fs.existsSync(SW_PATH)) {
    console.warn(`[stamp-sw] No service worker found at ${SW_PATH}, skipping.`)
    return
  }

  const version = getBuildVersion()
  const cacheName = `nexcart-${version}`

  let contents = fs.readFileSync(SW_PATH, 'utf8')
  const pattern = /const CACHE_NAME = ['"][^'"]*['"]/

  if (!pattern.test(contents)) {
    console.warn('[stamp-sw] Could not find CACHE_NAME declaration in sw.js, skipping.')
    return
  }

  contents = contents.replace(pattern, `const CACHE_NAME = '${cacheName}'`)
  fs.writeFileSync(SW_PATH, contents, 'utf8')

  console.log(`[stamp-sw] Stamped service worker with cache name: ${cacheName}`)
}

main()
