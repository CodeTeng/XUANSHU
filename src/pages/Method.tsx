import { useUi } from '../lib/uiStore'
import { SectionTitle, Badge, Term } from '../components/ui'
import { LEVEL_NOTE, type SourceLevel } from '../data/glossary'

const LEVELS: { key: SourceLevel; meaning: string }[] = [
  { key: '✅', meaning: '取得原文，逐字核对过（版本见下表）' },
  { key: '🧮', meaning: '古法规则按原样实现，与独立数据源逐项对照一致' },
  { key: '📖', meaning: '出处为业内公认，本次未取得原文，引文以通行本为准' },
  { key: '⚖', meaning: '无单一经典出处，或各派说法不一，使用时须说明取哪一派' },
]

const MODULES = [
  {
    name: '四柱八字',
    engine: 'lunar-javascript 1.7（6tail，与 lunar-python 同作者同源）',
    source: 'bazi-skill / fengshui.skill bazi.py',
    status: '🧮' as SourceLevel,
    note: '四柱、十神、藏干、纳音、地势由库直接给出。1990-05-15 12:00 例与 pai_pan.py 输出逐字一致。夜子时另按 pai_pan.py 口径修正为「日柱取次日」。',
  },
  {
    name: '紫微斗数',
    engine: 'iztro 2.6（三合派）',
    source: 'Numerologist_skills ziwei-doushu',
    status: '📖' as SourceLevel,
    note: '十二宫安星、生年四化、大限由 iztro 计算。命宫位置（生月逆数生时）与 ziwei_cli.py 逐例核对一致；个别杂曜安法各派略有出入。',
  },
  {
    name: '奇门遁甲',
    engine: '逐行移植 qimen_cli.py 的时家转盘奇门',
    source: 'Numerologist_skills qimen-dunjia',
    status: '🧮' as SourceLevel,
    note: '二十四节气定阴阳遁、符头定三元、中五寄坤、值符加时干、值使逐时移宫。以 2026-11-21 15:00 为例手工推演全盘核对通过。',
  },
  {
    name: '玄空飞星',
    engine: '移植 kanyu/feixing.py + core.py',
    source: 'voidforall/fengshui.skill',
    status: '🧮' as SourceLevel,
    note: '二十四山玄空阴阳、三元龙定顺逆、替卦、旺山旺向 / 上山下水 / 双星 / 伏反吟 / 合十 / 三般卦判定。8 运子山午向与脚本逐宫一致。',
  },
  {
    name: '八宅命卦',
    engine: '移植 kanyu/bazhai.py',
    source: 'voidforall/fengshui.skill',
    status: '🧮' as SourceLevel,
    note: '游年歌诀出自《八宅明镜》，命卦按立春分年，男五寄坤、女五寄艮。',
  },
  {
    name: '择日',
    engine: '建除十二神 + 黄历宜忌 + 冲当事人 + 月破',
    source: 'voidforall/fengshui.skill（简化）',
    status: '⚖' as SourceLevel,
    note: '只做硬排除与粗打分，未实现岁破、三煞、四废等全量神煞推演。结果应作初筛，不宜直接当作择日结论。',
  },
  {
    name: '塔罗',
    engine: '自建 78 张牌库 + mulberry32 伪随机',
    source: 'daman-ovo-0404/tarot-skill（纪律）',
    status: '⚖' as SourceLevel,
    note: '抽牌纪律照 cards.md：必须由脚本抽、必须展示 seed 与 time_factor、必须可复现。牌义与 SVG 牌面为本项目自建。',
  },
  {
    name: '姻缘',
    engine: '100 支签诗 + 合婚 / 生肖 / 桃花规则',
    source: 'Ming-H/yinyuan-skills',
    status: '⚖' as SourceLevel,
    note: '签诗从 fortune-sticks.md 提取为 JSON；六合三合六冲六害三刑、桃花位、合婚四段照 references 实现，评分为本项目口径。',
  },
]

const TEXTS = [
  ['《三命通会》', '维基文库本 卷一、卷二、卷三', '✅ 已取得'],
  ['《渊海子平》', '维基文库本', '✅ 已取得'],
  ['《穷通宝鉴》', '维基文库本（调候原文索引）', '✅ 已取得'],
  ['《滴天髓阐微》', '维基文库本（命例用于校核）', '✅ 已取得'],
  ['《沈氏玄空学》', '未取得原文', '❌ 仅作流派名称'],
  ['《八宅明镜》', '维基文库未收', '❌ 用通行歌诀'],
  ['《协纪辨方书》', '未取得原文', '❌ 择日未引原文'],
]

export default function Method() {
  const goto = useUi((s) => s.goto)

  return (
    <div className="mx-auto max-w-[900px]">
      <div className="mb-8">
        <div className="mono text-[0.6rem] tracking-[0.32em] text-[#6a5730]">METHOD & SOURCES</div>
        <h1 className="mt-2 serif text-[1.9rem] tracking-[0.1em] text-[#f2dcae]">方法与出处</h1>
        <p className="mt-3 max-w-[620px] text-[0.84rem] leading-[1.95] text-[#8b8899]">
          这一页回答一个问题：屏幕上的每个字，依据是什么。规则、口径、核对状态都列在这里，不在这张表上的说法，本站不使用。
        </p>
      </div>

      <div className="panel corner-frame mb-6 p-6">
        <SectionTitle index="01" title="为什么把排盘和解读分开" />
        <div className="space-y-3 text-[0.82rem] leading-[2] text-[#a9a6b8]">
          <p>
            大模型很会说话，但不擅长排盘。历法换算、定局起盘、安星布门这些地方，「看起来对」的错误最难被发现。
            所以本站的每一次推演都分成两段：<span className="text-[#d8b06a]">算法先算出盘面</span>，
            <span className="text-[#d8b06a]">模型只负责把符号翻成人话</span>。
          </p>
          <p>
            这带来两个结果：同一次输入永远得到同一个盘；换模型不会改变盘面。你随时可以拿这里的结果去和通行排盘软件对照，
            对不上就是 bug，不是「流派不同」。
          </p>
        </div>
      </div>

      <div className="panel corner-frame mb-6 p-6">
        <SectionTitle index="02" title="依据等级" desc="沿用 fengshui.skill 的核对状态体系" />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {LEVELS.map((l) => (
            <div key={l.key} className="flex gap-3 border border-white/7 bg-white/[0.015] px-3 py-2.5">
              <span className="serif text-[1rem] leading-none text-[#d8b06a]">{l.key}</span>
              <div>
                <div className="text-[0.72rem] text-[#ded9ea]">{LEVEL_NOTE[l.key]}</div>
                <div className="mt-0.5 text-[0.66rem] leading-relaxed text-[#6f6c7d]">{l.meaning}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel corner-frame mb-6 p-6">
        <SectionTitle index="03" title="各模块的算法与出处" />
        <div className="space-y-3">
          {MODULES.map((m) => (
            <div key={m.name} className="border-l border-[rgba(216,176,106,0.2)] pl-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="serif text-[0.92rem] text-[#e8e3f0]">{m.name}</span>
                <span className="text-[0.62rem] text-[#8a7a5a]">{m.status} {LEVEL_NOTE[m.status]}</span>
              </div>
              <div className="mt-1 text-[0.7rem] text-[#8b8899]">{m.engine}</div>
              <div className="mt-0.5 mono text-[0.62rem] text-[#5f5c6d]">来源：{m.source}</div>
              <p className="mt-1.5 text-[0.74rem] leading-[1.9] text-[#7d7a8d]">{m.note}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="panel corner-frame mb-6 p-6">
        <SectionTitle index="04" title="所用文本" desc="引文以维基文库公有领域本为准；未取得的典籍只作流派名称提及，不引原文" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-[0.72rem]">
            <thead>
              <tr className="border-b border-white/10 text-[0.62rem] tracking-wider text-[#8a7a5a]">
                <th className="py-2 pr-3 font-normal">典籍</th>
                <th className="py-2 pr-3 font-normal">版本 / 来源</th>
                <th className="py-2 font-normal">状态</th>
              </tr>
            </thead>
            <tbody>
              {TEXTS.map(([name, ver, st]) => (
                <tr key={name} className="border-b border-white/5">
                  <td className="py-2 pr-3 text-[#cfcbdb]">{name}</td>
                  <td className="py-2 pr-3 text-[#8b8899]">{ver}</td>
                  <td className={`py-2 ${st.startsWith('✅') ? 'text-[#8ec9a8]' : 'text-[#c08a82]'}`}>{st}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel corner-frame mb-6 p-6">
        <SectionTitle index="05" title="已知边界" />
        <ul className="space-y-2 text-[0.78rem] leading-[1.9] text-[#8b8899]">
          {[
            '不保存任何测算记录，刷新即清空。',
            '不卖摆件、不做化解商品推荐；风水建议优先用调整功能分区与动线这类零成本手段。',
            '不替代医疗、法律、投资建议；涉及健康提示就医，涉及财务提示理性决策。',
            '择日为简化版，只做硬排除与粗打分，未实现全量神煞推演。',
            '塔罗牌面为本项目自绘 SVG，非韦特牌原图。',
            '紫微个别杂曜的安法各派有出入，本站以 iztro 的实现为准。',
          ].map((t, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-[9px] h-[3px] w-[3px] shrink-0 rotate-45 bg-[#8a6f3c]" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pb-4">
        <button onClick={() => goto('bazi')} className="btn">去看一张八字盘</button>
        <button onClick={() => goto('home')} className="btn btn-ghost">回到首页</button>
      </div>
    </div>
  )
}
