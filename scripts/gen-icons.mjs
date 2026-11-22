/**
 * 从 favicon.svg 生成各尺寸图标。
 *   node scripts/gen-icons.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const svg = fs.readFileSync('public/favicon.svg', 'utf8')
const SIZES = [
  { file: 'favicon-32.png', size: 32 },
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
]

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
const page = await browser.newPage()

for (const { file, size } of SIZES) {
  await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 })
  await page.setContent(
    `<style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}svg{display:block;width:100vw;height:100vh}</style>${svg}`,
    { waitUntil: 'load' },
  )
  await page.screenshot({ path: path.join('public', file), omitBackground: true })
  console.log(`${file}  ${size}x${size}`)
}

await browser.close()

// 把 32px PNG 封成 ICO（PNG-in-ICO，IE9+ 与所有现代浏览器都认）
const png = fs.readFileSync('public/favicon-32.png')
const header = Buffer.alloc(6)
header.writeUInt16LE(0, 0)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(1, 4)

const dir = Buffer.alloc(16)
dir[0] = 32
dir[1] = 32
dir[2] = 0
dir[3] = 0
dir.writeUInt16LE(1, 4)
dir.writeUInt16LE(32, 6)
dir.writeUInt32LE(png.length, 8)
dir.writeUInt32LE(22, 12)

fs.writeFileSync('public/favicon.ico', Buffer.concat([header, dir, png]))
console.log('favicon.ico  (32x32, PNG-in-ICO)')
