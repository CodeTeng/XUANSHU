/**
 * 假的 OpenAI 兼容端点，用于本地验证流式渲染链路。
 * node scripts/mock-llm.mjs
 */
import http from 'node:http'

const SAMPLE = `## 一眼看懂

这个盘最突出的地方是**日主庚金坐辰，金水相生而火气不弱**。简单说：你能扛事，也能说清事，但容易在「该不该先动手」上反复。

## 日主与旺衰

日主庚金生于巳月，巳中丙火当令，看似被克。但月干辛金透出、日支辰土生金，年支午火虽旺却隔了一位，所以是**身弱偏中和**，不是从弱。

- 得令：巳月火旺，金不当令（不得令）
- 得地：辰为湿土，能生金（得地）
- 得势：年干庚、月干辛两个比劫帮身（得势）

## 十神与结构

月令巳中丙火为**七杀**，透在藏干而未透干，格局取「七杀格」但力不强。七杀主压力与执行力，落在月柱说明这股力量来自工作环境而非家庭。

年柱庚午，比肩坐正官，早年靠自己争。

## 五行与调候

五行个数 木2 火2 土1 金1 水2，实际是**火金相战、水木通关**的结构。

《穷通宝典》论庚金生巳月：「丙火为尊，丁火次之，壬水为佐。」你时干透壬，是这盘的**关键用神**——把火气泄掉，让金能落地。

## 大运

当前走辛巳运（2019–2028），辛金帮身、巳火加压，是「资源到位但事也多」的十年。前五年多在建立，后五年开始兑现。

## 流年

2026 丙午，两火并见，压力峰值年。适合**收缩战线、把一件事做深**，不适合同时开三个新坑。

## 可校准的三个节点

1. 2017 年（丁酉）前后，应有一次明显的工作或居所变动——酉金冲卯木，动了「根基位」。
2. 2020 年（庚子），子午冲，情绪或健康上有一段低点。
3. 2023 年（癸卯），卯辰穿，人际或合作上有一次不痛快的收尾。

如果这三条有两条以上对得上，后面关于用神的判断可以采信；都不对，说明出生时辰需要复核。

## 建议

1. **把壬水用好**：具体做法是「多表达、多输出」，写作、讲解、复盘都算，这是你泄火的方式。
2. **2026 年只押一件大事**，其余保持维持状态。
3. 秋冬两季做决策，春夏两季做执行——你的盘在金水旺时更清醒。

> 命理分析仅供参考，人生在于自身的努力和选择。`

const server = http.createServer((req, res) => {
  if (req.url?.endsWith('/models')) {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ data: [{ id: 'mock-oracle' }] }))
    return
  }
  if (req.url?.endsWith('/chat/completions')) {
    let body = ''
    req.on('data', (c) => (body += c))
    req.on('end', () => {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      })
      const chars = Array.from(SAMPLE)
      let i = 0
      const tick = () => {
        if (i >= chars.length) {
          res.write('data: [DONE]\n\n')
          res.end()
          return
        }
        const chunk = chars.slice(i, i + 6).join('')
        i += 6
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: chunk } }] })}\n\n`)
        setTimeout(tick, 12)
      }
      tick()
    })
    return
  }
  res.writeHead(404).end()
})

server.listen(8899, '127.0.0.1', () => console.log('mock llm on 8899'))
