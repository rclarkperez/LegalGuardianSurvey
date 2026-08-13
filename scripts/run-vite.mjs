import crypto from 'node:crypto'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

if (!crypto.getRandomValues && crypto.webcrypto?.getRandomValues) {
  crypto.getRandomValues = crypto.webcrypto.getRandomValues.bind(crypto.webcrypto)
}

const vitePackagePath = require.resolve('vite/package.json')
const viteCliPath = join(dirname(vitePackagePath), 'bin/vite.js')

await import(pathToFileURL(viteCliPath).href)
