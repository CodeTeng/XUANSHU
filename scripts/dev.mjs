/**
 * 一条命令同时起 Vite 与代理服务。
 * Vite 负责页面（5173），server 负责 /api/llm（8787）。
 */
import { spawn } from 'node:child_process'

const procs = []

function run(cmd, args, name) {
  const p = spawn(cmd, args, { stdio: 'inherit', shell: true })
  p.on('exit', (code) => {
    if (code !== null && code !== 0) console.log(`[${name}] 退出，code ${code}`)
  })
  procs.push(p)
  return p
}

run('node', ['server/index.mjs'], 'server')
run('npx', ['vite'], 'vite')

const kill = () => {
  procs.forEach((p) => p.kill())
  process.exit(0)
}
process.on('SIGINT', kill)
process.on('SIGTERM', kill)
