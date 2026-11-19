---
name: research-pipeline
description: "编排多源研究：主代理跑 learn，子代理跑 research；用于报告、brief、深度调研、需要引用的成稿。单事实查询不要用。"
---

# Research Pipeline

## 用途

把 `learn` 和 `research` 组合成一条可重复的研究流水线。主代理负责范围、结构、写作和判断；子代理负责读一手来源、写引用笔记。

本 skill 不复制两个底层 skill 的步骤。主流程执行时加载 `learn`；派子代理时让子代理加载 `research`。

## 依赖来源

这两个底层 skill 由上游作者维护，本仓库原样收录在 `skills/learn/` 和 `skills/research/`：

- `learn`：[tw93/Waza](https://github.com/tw93/Waza) 的 `skills/learn/SKILL.md`，MIT，版权归 Tw93。
- `research`：[mattpocock/skills](https://github.com/mattpocock/skills) 的 `skills/engineering/research/`，MIT，版权归 Matt Pocock。

具体 commit、sha256 与同步命令见各自目录的 `SOURCE.md`。升级换 vendor 文件，不要在这里复制它们的正文。

## 何时使用

- 多源研究，需要一份带引用的成稿、报告、brief、白皮书或综述。
- 题目有 3 个以上子问题，或预计来源超过 10 个。
- 需要把阅读工作并行化，主线程继续做结构或写作。
- 需要事实核验、引用追溯、矛盾并列。

## 何时不用

- 单事实查询、单 URL 总结、查一条 API 或文档：只用 `research`。
- 已有完整材料，只需要成稿：只用 `learn` 的 Write to Learn。
- 纯观点写作，不需要外部来源：不用本 skill。

## 角色

- 主代理：跑 `learn`。负责 Scope、Split、Merge、Outline、Draft、Refine、Self-review。
- 子代理：跑 `research`。负责一个非重叠子题，读一手来源，写一份带引用的 Markdown 笔记。
- 用户：确认范围、受众、截止时间、发布标准；在 Phase 6 线性读稿。

## 三种模式

| 模式 | 何时用 | 子代理数 | 出口 |
|---|---|---|---|
| Light | 一个子问题，但要引用 | 1 | 一份来源笔记；必要时再升级 |
| Standard | 3 到 4 个子问题，要成稿 | 2 到 3 | `learn` Phase 2 到 6 的成稿 |
| Full | 高 stakes、事实密集、要发布 | 3 到 4 + 1 核验 | 成稿 + 核验表 + 未验证项 |

## 六步流程

### 1. Scope

写 `00-brief.md`，包含：

- 核心问题（一句话）
- 受众与用途
- 输出类型（笔记、报告、长文、简报）
- 时间截止（绝对日期）
- 地理、时间、学科边界
- 来源标准（一手来源优先级）
- 引用格式
- 不做什么（out of scope）
- 成功标准

### 2. Split

把题目拆成 3 到 4 个非重叠子题。每个子题满足：

- 能独立回答
- 有明确的一手来源类型
- 不与其他子题共享同一批核心来源
- 输出一份笔记，而不是一章成稿

写 `01-plan.md`：子题、子代理、输出路径、截止时间。

### 3. Dispatch

每个子题派一个 `subagent`。子代理加载 `research` skill。Prompt 必须自包含，模板见下。

### 4. Merge

主代理读所有笔记，写 `02-source-map.md`：

- 子题 → 来源 → 关键 claim
- 覆盖缺口
- 矛盾清单（两边来源并列）
- 需要补查的 3 到 5 个点

如果缺口大，补派子代理；不要直接进入写作。

### 5. Learn

加载 `learn`，从 Phase 2 开始：

- Phase 2 Digest：把笔记变成心智模型，不写摘要。
- Phase 3 Outline：每节对应来源；没来源不写。
- Phase 4 Fill：按节写；写不动回到该节 Digest。
- Phase 5 Refine：删冗余、标缺口、去 AI 味。
- Phase 6 Self-review：用户线性读两遍；发布前确认。

如果只要笔记，停在 Phase 2，不强行成稿。

### 6. Verify

Full 模式：把成稿里的关键 claim 列成 10 到 15 条，派一个 `research` 子代理逐条核验：

- ✅ 有一手来源支持
- ⚠️ 来源不足或有矛盾
- ❌ 与一手来源冲突

输出 `06-verification.md`；回到 `learn` 改稿。Standard 模式可选；Light 模式跳过。

## 产物布局

默认：

```text
research/<topic>/
  00-brief.md
  01-plan.md
  02-source-map.md
  03-notes/
    <subtopic>.md
  04-outline.md
  05-draft.md
  06-verification.md
```

如果 repo 已有笔记目录，沿用 repo 约定；在 `00-brief.md` 里写明路径。

## 子代理 prompt 模板

```text
加载 research skill。你是本任务的子代理，只负责一个子题。

任务：<一句话>
范围：<时间/地理/问题边界>
来源：只查一手来源（官方文件、议会报告、法院判决、公司财报、API 文档、原始数据）。不要用二手综述替代。
引用：每条 claim 后紧跟 [来源](URL)，并标日期。无法追溯的 claim 不要写。
矛盾：如果来源冲突，并列两边，写清各自证据，不要选一个。
输出：写入 <绝对路径>.md。只写笔记，不写成稿。
字数：1500 到 2500 字。
返回：文件路径 + 3 到 5 条关键发现 + 未解决问题。
```

## 质量门

- 没有 `00-brief.md`，不派子代理。
- 没有 `02-source-map.md`，不进入 `learn` Phase 3。
- 每节至少一个来源；没有来源的节删掉或补查。
- 矛盾必须并列；不能静默选一个。
- 成稿里的数字、日期、引语必须能回到来源。
- 发布前必须有用户确认；不自动发布。

## 常见失败

- 子题重叠：多个子代理查同一批来源，浪费且结论冲突。Split 时检查来源重叠。
- 子代理写文章：返回一篇议论文，不是笔记。Prompt 明确“只写笔记”，并给字数上限。
- 二手来源冒充一手：子代理引用新闻转述。要求追到原始文件或数据。
- 引用格式不统一：合并时无法对应。在 Brief 里定死格式。
- 子代理没有输出路径：文件散落。Prompt 给绝对路径。
- 主代理跳过 Outline 直接写：结构塌。质量门拦住。
- 把 `learn` 和 `research` 的全文抄进本 skill：第三份真相，必漂移。只写编排，执行时加载底层 skill。

## 示例

题目：北约东扩进程研究。

- Scope：1991 到 2026，欧洲-大西洋，中文读者，5000 字报告，截止 2026-11-09。
- Split：1991 到 2008 扩员；2008 到 2022 冻结；2022 到 2026 北扩；俄罗斯“不东扩”档案争议。
- Dispatch：4 个 `research` 子代理，各写 1500 到 2500 字笔记。
- Merge：时间表 + 争议清单 + 缺口（中国视角、2026 安卡拉后续）。
- Learn：Phase 2 到 6 成稿。
- Verify：核验 10 条 claim（安卡拉宣言是否提乌克兰入约、乌克兰 MAP 免除年份、芬兰和瑞典加入日期）。
- 交付：报告 + 4 份笔记 + 核验表 + 未验证项。

## 与其他 skill 的关系

- `learn`：主流程；本 skill 不复制它的六阶段。
- `research`：子代理流程；本 skill 不复制它的三步。
- `read`：单 URL 或 PDF 抓取；子代理可用。
- `kb-archive`：成稿后归档；本 skill 不负责归档。
