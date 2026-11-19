# 来源：research

本目录是第三方技能，原样收录。`SKILL.md` 与 `agents/openai.yaml` 与上游逐字一致，没有本地修改。

| 项目 | 值 |
| --- | --- |
| 上游仓库 | [mattpocock/skills](https://github.com/mattpocock/skills) |
| 上游路径 | `skills/engineering/research/`，收了 `SKILL.md` 与 `agents/openai.yaml` |
| 收录 commit | `7739eaed7f8f3915437a8def198a6d0d7206dbc7`，2026-10-29，`Start subagents with a fresh context window, not a fork (#1341)` |
| 抓取日期 | 2026-11-14，取自 `main` |
| sha256 | `SKILL.md` 为 `1f629e18ab899412683bc6a1c4efb4339999e27c2fdac328f26ee10a8c031d33`；`agents/openai.yaml` 为 `9b4c470d63221c1f68f22df70b83e2f12401b317babe0d1b7b5f24a974474d0d` |
| 许可 | MIT，Copyright (c) 2026 Matt Pocock，全文见 [LICENSE](LICENSE) |
| 上游记录 | 本机 `~/.agents/.skill-lock.json` 记为 `mattpocock-skills`，来源 `mattpocock/skills`，`skillPath` 为 `skills/engineering/research/SKILL.md` |

本机 `~/.agents/skills/research/DESCRIPTION.md` 不在上游仓库里，是本地分发器加的，未收录。

## 更新

```bash
base=https://raw.githubusercontent.com/mattpocock/skills/main/skills/engineering/research
curl -fsSL "$base/SKILL.md" -o skills/research/SKILL.md
curl -fsSL "$base/agents/openai.yaml" -o skills/research/agents/openai.yaml
shasum -a 256 skills/research/SKILL.md skills/research/agents/openai.yaml
```

更新后改上表的 commit 与 sha256，再跑 `bash scripts/validate.sh`。

## 不要就地改

要改这个技能的行为，改上游，或者在自己的技能里覆盖它。就地改 vendor 文件后，下一次同步就丢改动。
