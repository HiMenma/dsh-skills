#!/usr/bin/env node
/**
 * ASD-STE100 风格自检：读 markdown / 纯文本，按行报违规。
 * 规则判据见下面的 RULES 表；每条判据的来源（STE 条文／STC 社区移植／仓 库约定）见 references/zh-adaptation.md。
 * 用法：node check_style.mjs <文件> | -        （- 表示从 stdin 读，用于检查一段回复）
 *       --max-zh 40 --max-en 25 --quiet --json
 */
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const opts = { maxZh: 40, maxEn: 25, quiet: false, json: false };
const files = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--max-zh') opts.maxZh = Number(args[++i]) || opts.maxZh;
  else if (args[i] === '--max-en') opts.maxEn = Number(args[++i]) || opts.maxEn;
  else if (args[i] === '--quiet') opts.quiet = true;
  else if (args[i] === '--json') opts.json = true;
  else if (args[i] === '--help' || args[i] === '-h') { usage(); process.exit(0); }
  else files.push(args[i]);
}
if (!files.length) { usage(); process.exit(2); }

function usage() {
  console.log('用法：node check_style.mjs <文件.md>|- [--max-zh 40] [--max-en 25] [--quiet] [--json]');
  console.log('  - 从 stdin 读，用于自检一段即将发出的回复');
  console.log('退出码：有 FAIL 记 1，仅 WARN/INFO 记 0');
}

const RULES = {
  'ZH-01': '一句只说一件事：句子长度超上限',
  'ZH-02': '被动句/施事者不明：谁做的要写出来',
  'ZH-03': '义务分级不清：必须(硬约束)/建议(推荐)/可以(可选) 只能选一档',
  'ZH-04': '开放式列举：把清单写全，不用「等」',
  'ZH-05': '动词名词化：弱动词+动名词，直接用那个动词',
  'ZH-06': '指代不清：这/该/其/它 没有明确先行词',
  'ZH-07': '相对时间：写绝对日期或绝对时点',
  'ZH-08': '双重否定：改成正着说',
  'ZH-09': '定语过长：一句里「的」套了三层以上',
  'ZH-10': '条件句写成「当…时」：条件用「如果…就…」',
  'ZH-11': '一句里塞了多个动作：拆成多句或做成编号步骤',
  'ZH-12': 'mermaid 图：本仓库渲染失败，改表格/文本/ASCII',
  'ZH-13': '英文被动语态：改主动语态并补施事者',
  'ZH-14': '英文模糊承诺词：换成 must / should / may 三档之一',
  'ZH-15': '缩略语首次出现要给全称',
  'ZH-16': '结论默认用话说完，表格只在用户明确要清单时用',
  'ZH-17': '一段不超过六句（STE 6.6）',
  'ZH-18': '英文句里不用分号，拆成两句（STE 8.1）',
};
const KIND = {
  'ZH-01': 'FAIL', 'ZH-02': 'WARN', 'ZH-03': 'FAIL', 'ZH-04': 'FAIL', 'ZH-05': 'FAIL',
  'ZH-06': 'WARN', 'ZH-07': 'WARN', 'ZH-08': 'WARN', 'ZH-09': 'WARN', 'ZH-10': 'WARN',
  'ZH-11': 'WARN', 'ZH-12': 'FAIL', 'ZH-13': 'WARN', 'ZH-14': 'WARN', 'ZH-15': 'INFO',
  'ZH-16': 'INFO', 'ZH-17': 'WARN', 'ZH-18': 'WARN',
};

const CJK = /[㐀-䶿一-鿿豈-﫿]/;
const cjkCount = (s) => (s.match(/[㐀-䶿一-鿿豈-﫿]/g) || []).length;
const clip = (s, n = 46) => (s.length > n ? s.slice(0, n) + '…' : s);

// —— 抽句子：跳过 frontmatter / 代码块 / 行内代码 / URL，表格按单元格切 ——
function unitsFrom(text) {
  const lines = text.replace(/\r/g, '').split('\n');
  const units = [];
  let skip = 0;
  if (lines[0] === '---') {
    for (let i = 1; i < lines.length; i++) if (lines[i].trim() === '---') { skip = i + 1; break; }
  }
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (/^(```|~~~)/.test(t)) {
      if (!inFence && /mermaid/i.test(t)) units.push({ line: i + 1, text: 'mermaid 图', kind: 'fence' });
      inFence = !inFence; continue;
    }
    if (inFence || i < skip || !t) continue;
    if (/ste100:allow/.test(t)) continue;   // 行级豁免：只用于禁用词清单和反例
    if (/^!\[/.test(t)) continue;
    if (/^\|[\s:|-]+\|$/.test(t)) continue;
    const clean = (s) => s
      .replace(/`[^`]*`/g, ' ')
      .replace(/\s*https?:\/\/\S+/g, ' ')
      .replace(/\*\*|__|~~/g, '')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .trim();
    if (t.startsWith('|')) {
      t.split('|').slice(1, -1).forEach((c) => {
        const s = clean(c);
        if (s && s !== '---') units.push({ line: i + 1, text: s, kind: 'cell' });
      });
      continue;
    }
    const h = /^#{1,6}\s+(.*)$/.exec(t);
    if (h) { const s = clean(h[1]); if (s) units.push({ line: i + 1, text: s, kind: 'head' }); continue; }
    const s0 = clean(t.replace(/^>\s*/, '').replace(/^([-*+]\s+|\d+[.)]\s+)/, ''));
    if (!s0) continue;
    const pieces = s0.split(/(?<=[。！？；])/).map((x) => x.trim()).filter(Boolean);
    for (const p of pieces) {
      if (CJK.test(p)) { units.push({ line: i + 1, text: p, kind: 'zh' }); continue; }
      for (const e of p.split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter(Boolean)) {
        units.push({ line: i + 1, text: e, kind: 'en' });
      }
    }
  }
  return units;
}

// —— 逐句判据 ——
const ZH_PATTERNS = [
  ['ZH-03', /必要时|视情况|酌情|原则上|一般情况下|具体情况|需要确认|待确认|有待|需要评估|需要进一步|不得不|尽量|应尽可能/, '出现「$&」'],
  ['ZH-05', /(进行|作出|做出|开展|予以|给予|实行|采取|做)(了)?[一-鿿]{0,4}(检查|分析|处理|说明|测试|验证|核查|核对|配置|调整|评估|确认|记录|统计|优化|调查|清理|回填|登记)/, '名词化「$&」'],
  ['ZH-05', /对[一-鿿]{1,10}进行/, '名词化「$&」'],
  ['ZH-06', /^(这|该|此|其|它)(样|一点|个问题|件事|些|中|表明|说明|意味着|表示|导致|外)/, '句首指代「$&」'],
  ['ZH-06', /(这表明|这说明|该情况|此问题|这一点)/, '指代「$&」'],
  ['ZH-07', /昨天|今天|明天|前天|后天|上周|下周|上个月|下个月|最近|近期|目前|当前|后续|前期|这几天|今年以来|这两天/, '相对时间「$&」'],
  ['ZH-08', /不是没有|并非没有|不能不|不会不|不不|避免[^，。；：]{0,8}不/, '双重否定「$&」'],
  ['ZH-10', /当[一-鿿]{2,20}时(，|,)/, '条件句「$&」'],
];
const EN_PATTERNS = [
  ['ZH-13', /\b(is|are|was|were|been|being)\s+(?:\w+ed|written|made|taken|given|sent|held|set|run|built|kept|found)\b/, '被动「$&」'],
  ['ZH-14', /\b(shall|ensure|ensures|allow|allows|permit|make sure|be sure to|it is important to|should be noted|basically|approximately)\b/i, '模糊承诺「$&」'],
  ['ZH-04', /\betc\.?\b|and so on|and the like/i, '开放式列举「$&」'],
  ['ZH-18', /;/, '英文句用了分号'],
];

// 「等」＝开放式列举：只在列举语境里判，避开 相等/幂等/等级 这类词
const LIST_HINT = /[、，]|包括|支持|涵盖|以及|例如/;
function openEnded(t) {
  if (/等等|诸如此类|以此类推|其他相关|之类的/.test(t)) return true;
  const m = /等(?=[。，、；：)）]|$)/.exec(t);
  if (!m) return false;
  if (/[相同力级价权平不无好次序候幂低高]/.test(t.charAt(m.index - 1))) return false;
  return LIST_HINT.test(t);
}

function checkUnit(u) {
  const out = [];
  const push = (id, note) => out.push({ id, note });
  if (u.kind === 'fence') return [{ id: 'ZH-12', note: RULES['ZH-12'] }];
  if (u.kind === 'cell' || u.kind === 'head') {
    if (openEnded(u.text)) push('ZH-04', RULES['ZH-04']);
    return out;
  }
  const pats = u.kind === 'en' ? EN_PATTERNS : ZH_PATTERNS;
  const seen = new Set();
  for (const [id, re, fmt] of pats) {
    const m = re.exec(u.text);
    if (!m || seen.has(id)) continue;
    seen.add(id);
    push(id, fmt ? fmt.replace(/\$&/g, m[0]) : RULES[id]);
  }
  if (u.kind === 'zh') {
    if (openEnded(u.text)) push('ZH-04', '「等」把清单留了口子');
    const n = cjkCount(u.text);
    if (n > opts.maxZh) push('ZH-01', `句长 ${n} 字 > 上限 ${opts.maxZh} 字`);
    const clauses = u.text.split(/[，、；：]/).filter((x) => cjkCount(x) > 1);
    if (n > opts.maxZh * 0.6 && clauses.length >= 5) push('ZH-11', `${clauses.length} 个分句挤在一句里`);
    const de = (u.text.match(/的/g) || []).length;
    if (de >= 3) push('ZH-09', `一句内「的」出现 ${de} 次`);
    if (/被(?!引|动|除)[一-鿿]/.test(u.text)) push('ZH-02', `被动「${/被[一-鿿]{1,4}/.exec(u.text)[0]}」`);
  } else {
    const words = u.text.split(/\s+/).filter(Boolean);
    if (words.length > opts.maxEn) push('ZH-01', `句长 ${words.length} 词 > 上限 ${opts.maxEn} 词`);
    if (/^(This|That|It|These|Those|Which)\s+(means|show|shows|indicate|indicates|is|are)\b/.test(u.text)) push('ZH-06', '句首指代不清');
  }
  return out;
}

function collectAcronyms(units) {
  const map = new Map();
  for (const u of units) {
    for (const a of u.text.match(/\b[A-Z]{2,6}\b/g) || []) {
      if (['TODO', 'FIXME', 'NOTE', 'API', 'SQL', 'OK', 'ID', 'PR', 'CI', 'CD', 'UTC', 'HTTP', 'HTTPS', 'JSON', 'YAML', 'PDF', 'HTML', 'CSS', 'XML', 'UI'].includes(a)) continue;
      map.set(a, (map.get(a) || 0) + 1);
    }
  }
  return [...map.entries()].filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, c]) => `${k}×${c}`);
}

function paragraphCounts(text) {
  const lines = text.replace(/\r/g, '').split('\n');
  const res = [];
  let inFence = false, count = 0, start = 0;
  const flush = () => { if (count > 6) res.push({ line: start, sentences: count }); count = 0; start = 0; };
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (/^(```|~~~)/.test(t)) { inFence = !inFence; flush(); continue; }
    if (inFence) continue;
    if (!t || t.startsWith('|') || /^#{1,6}\s/.test(t) || /ste100:allow/.test(t)) { flush(); continue; }
    // 列表项按 STE 8.4 各算一句，引用块多为原文，都不并入段落计数
    if (/^>/.test(t) || /^([-*+]\s+|\d+[.)]\s+)/.test(t)) { flush(); continue; }
    const body = t.replace(/`[^`]*`/g, ' ');
    if (!start) start = i + 1;
    count += (body.match(/[。！？；]/g) || []).length + (body.match(/[.!?](?=\s|$)/g) || []).length;
  }
  flush();
  return res;
}

function run() {
  const spec = files[0];
  const src = spec === '-' ? readFileSync(0, 'utf8') : readFileSync(spec, 'utf8');
  const units = unitsFrom(src);
  const findings = [];
  for (const u of units) for (const f of checkUnit(u)) findings.push({ ...f, line: u.line, text: u.text, sev: KIND[f.id] });
  for (const p of paragraphCounts(src)) findings.push({ id: 'ZH-17', sev: KIND['ZH-17'], line: p.line, text: `本段共 ${p.sentences} 句`, note: `一段 ${p.sentences} 句 > 上限 6 句（STE 6.6）` });
  findings.sort((a, b) => a.line - b.line);

  const tables = [];
  let cur = 0;
  for (const line of src.replace(/\r/g, '').split('\n')) {
    if (line.trim().startsWith('|')) cur++;
    else if (cur) { if (cur > 6) tables.push(cur); cur = 0; }
  }
  if (cur > 6) tables.push(cur);

  const n = (sev) => findings.filter((f) => f.sev === sev).length;
  const summary = {
    file: spec === '-' ? '(stdin)' : spec,
    units: units.length,
    zhChars: units.reduce((a, u) => a + cjkCount(u.text), 0),
    fail: n('FAIL'), warn: n('WARN'), info: 0,
    findings: findings.slice(0, 80),
    truncated: findings.length > 80,
    tables, acronyms: collectAcronyms(units),
  };
  summary.info = tables.length + summary.acronyms.length;

  if (opts.json) { console.log(JSON.stringify(summary, null, 2)); return summary; }
  if (!opts.quiet) {
    console.log(`ste100-check ${summary.file}  句 ${summary.units} / 中文 ${summary.zhChars} 字`);
    for (const f of summary.findings) {
      console.log(`${f.sev.padEnd(4)} L${String(f.line).padStart(4)}  ${f.id}  ${f.note}`);
      console.log(`           「${clip(f.text)}」`);
    }
    if (summary.truncated) console.log(`… 其余 ${findings.length - 80} 条已省略（用 --json 取全量）`);
    for (const rows of summary.tables) console.log(`INFO L  —   ZH-16  表格 ${rows} 行：结论默认用话说完，表格只在用户要清单时用`);
    if (summary.acronyms.length) console.log(`INFO L  —   ZH-15  缩略语需确认已给全称：${summary.acronyms.join(', ')}`);
  }
  console.log(`汇总：FAIL=${summary.fail} WARN=${summary.warn} INFO=${summary.info}  ${summary.fail ? '不通过' : '通过'}`);
  return summary;
}

try { process.exit(run().fail ? 1 : 0); }
catch (e) { console.log(`检查未完成：${e.message}`); process.exit(2); }
