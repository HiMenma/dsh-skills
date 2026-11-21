# dsh-skills

我在 DSH（DeepSeek Harness）里自用的 Agent Skills 集合。一个技能一个目录，用 git 管版本。`install.sh` 把技能装回 `~/.dsh/skills`，DSH 开新会话时自动加载。其中 `learn`、`research` 是上游技能的原样收录，用来让 `research-pipeline` clone 下来就能跑。

## 技能清单

| 技能 | 做什么 | 需要什么 | 来源 |
| --- | --- | --- | --- |
| `ai-product-design-review` | 按 11 条可判定清单评审产品界面与文案，输出带位置与改法的修复项 | 无硬依赖；截图对比可选 `ego-browser` 与 PDF 合并工具 | 本仓库维护 |
| `article-claim-factcheck` | 核实中文长文里的可核查主张，按一手来源分级取证，输出 ✅⚠️❌ 表 | DSH 联网检索工具 | 本仓库维护 |
| `video-claim-factcheck` | 核实 B 站 / YouTube 视频口播，连带交付清理后的文字稿 | `yt-dlp`、`ffmpeg`、whisper 环境 | 本仓库维护 |
| `wechat-article-read` | 抓公众号文章，转成干净 Markdown | `python3`（只用标准库） | 本仓库维护 |
| `kb-archive` | 按固定六字段 frontmatter 归档文档进知识库 | 环境变量 `KB_ROOT`，默认 `~/Documents/知识库` | 本仓库维护 |
| `live-stream-source-finder` | 查指定频道的 HLS 直播源，分级实测后输出可导入的 m3u | `python3`、`ffmpeg`、`ffprobe`、`curl` | 本仓库维护 |
| `learn` | 六阶段研究流程：收源 → 消化 → 大纲 → 成稿 → 精修 → 自审 | DSH 联网检索；可选 `read`、`write` | [tw93/Waza](https://github.com/tw93/Waza)，MIT，原样收录 |
| `research` | 派后台子代理查一手来源，产出一份带引用的 Markdown 笔记 | `subagent` 工具 | [mattpocock/skills](https://github.com/mattpocock/skills)，MIT，原样收录 |
| `research-pipeline` | 主代理跑 `learn`、子代理跑 `research` 的多源研究流水线 | 本仓库的 `learn`、`research` | 本仓库维护 |
| `ste100-style` | 用 ASD-STE100 的写作纪律约束中文技术输出 | `node`；可选 STE100 原文 PDF | 本仓库维护 |

## 安装

```bash
git clone git@github.com:HiMenma/dsh-skills.git ~/Documents/GitHub/dsh-skills
cd ~/Documents/GitHub/dsh-skills
./install.sh                 # 复制全部技能到 ~/.dsh/skills
./install.sh ste100-style    # 只装一个
./install.sh --check         # 只比对，不写文件
./install.sh --force learn   # 跳过同名检查，强制装这一个
```

装完开一个新会话，DSH 才会加载新技能。

`install.sh` 的复制是合并写入，不删目标目录里已有的文件。本机独有的文件（例如 STE100 的 PDF）不会被冲掉。

装之前 `install.sh` 会先查 `~/.agents/skills`、`~/.claude/skills`、`~/.codex/skills`、`~/.qoder/skills`：目标目录还没装过、但别的根目录已有同名技能时跳过，不往 `~/.dsh/skills` 里塞第二份。理由：DSH 同时扫 `~/.dsh/skills` 和 `~/.agents/skills`，装两份会在会话里出现两个同名技能。已经装在目标目录的技能照常同步；要强装加 `--force`。

## 日常流程

| 场景 | 命令 |
| --- | --- |
| 改了仓库里的技能 | `./install.sh <name>` |
| 直接在 `~/.dsh/skills` 里改了 | `./capture.sh <name>`，再 `git commit` |
| 想知道两边差在哪 | `./install.sh --check` 或 `./capture.sh --check` |
| 外部目录已有同名技能，仍要装仓库这份 | `./install.sh --force <name>` |
| 加一个新技能 | 见下一节 |

## 新增技能

1. 建目录：`mkdir skills/<name>`。
2. 写 `skills/<name>/SKILL.md`。frontmatter 必须有 `name` 和 `description`，`name` 与目录名相同。
3. 自检：`bash scripts/validate.sh`。
4. 安装并验证：`./install.sh <name>`，开新会话问一句触发该技能的话。
5. 提交：`git add skills/<name> && git commit -m "feat: add <name>"`。

## 目录结构

```
dsh-skills/
├── skills/
│   ├── <name>/
│   │   └── SKILL.md         技能本体，可带 references/、scripts/、assets/
│   ├── learn/               第三方 skill（vendor），带 SOURCE.md 与上游 LICENSE
│   └── research/            第三方 skill（vendor），带 SOURCE.md 与上游 LICENSE
├── install.sh               仓库 → ~/.dsh/skills
├── capture.sh               ~/.dsh/skills → 仓库
├── scripts/validate.sh      frontmatter 自检（CI 也跑）
└── .github/workflows/       推送后自动校验
```

## 第三方技能（vendor）

`learn` 与 `research` 是别人的技能，本仓库原样收录。这样 `research-pipeline` clone 下来就能跑：主代理要 `learn`，子代理要 `research`，两个都在本仓库的 `skills/` 里。

| 技能 | 上游 | 上游路径 | 收录 commit | 许可 |
| --- | --- | --- | --- | --- |
| `learn` | [tw93/Waza](https://github.com/tw93/Waza) | `skills/learn/SKILL.md` | `6d988e2`（2026-10-06） | MIT © 2026 Tw93 |
| `research` | [mattpocock/skills](https://github.com/mattpocock/skills) | `skills/engineering/research/` | `7739eae`（2026-10-29） | MIT © 2026 Matt Pocock |

每个 vendor 目录里有两份文件交代来源：`SOURCE.md` 记上游地址、路径、commit、抓取日期和 sha256；`LICENSE` 是上游许可原文。MIT 要求保留版权声明，所以这两份许可跟着目录走，不进仓库根的 `LICENSE`。

收录原则：内容逐字照抄，不改。要改行为就改上游，或者在自己的技能里覆盖它。就地改 vendor 文件，下一次同步会丢改动。

同步命令写在各自的 `SOURCE.md` 里，改完更新 commit 与 sha256，再跑 `bash scripts/validate.sh`。

## 原文版权文件不入库

`ste100-style/assets/ASD-STE100_ISSUE9.pdf` 与 `skills/ste100-style/assets/STE100_issue9_part1_writing_rules.txt` 被 `.gitignore` 排除。ASD-STE100 的版权归 ASD 所有，本仓库不再分发原文。

要逐字核对条文时，从 [ASD 下载页](https://www.asd-ste100.org/STE_downloads.html) 免费申请 Issue 9，再把 PDF 放进 `skills/ste100-style/assets/`。说明见该目录的 README。没有 PDF 也能用 `references/` 下的摘要。

## 知识库路径

`kb-archive` 不写死路径。归档根目录取环境变量 `KB_ROOT`，没设置时用 `~/Documents/知识库`。要换目录就 `export KB_ROOT=/你的/知识库`，技能正文不用改。

`scripts/validate.sh` 会把技能里写死的 `/Users/...`、`/home/...` 绝对路径打成提示。它不判失败，只提醒你换机器前要改。

## 本仓库不收的技能

本机还装了 `build-with-exa`、`exa-search`、`exa-contents`。这三个由 Exa 官方发布，不属于本仓库的范围。

## 许可

MIT，见 [LICENSE](LICENSE)。`learn`、`research` 两个 vendor 技能各自带上游 MIT 许可，版权归 Tw93 与 Matt Pocock。`ste100-style` 引用的 ASD-STE100 原文版权归 ASD。
