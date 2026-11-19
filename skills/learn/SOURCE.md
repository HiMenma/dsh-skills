# 来源：learn

本目录是第三方技能，原样收录。`SKILL.md` 与上游逐字一致，没有本地修改。

| 项目 | 值 |
| --- | --- |
| 上游仓库 | [tw93/Waza](https://github.com/tw93/Waza) |
| 上游路径 | `skills/learn/SKILL.md` |
| 收录 commit | `6d988e293c59c9f5dc0a811bcd1b49fd393b0ccc`，2026-10-06，`feat: guide explanation formats in learn` |
| 抓取日期 | 2026-11-14，取自 `main` |
| sha256 | `92c82660b3aa238e49fa48b3cd3b0b518b03f558fac4db6d96da4dc5279b44c4` |
| 许可 | MIT，Copyright (c) 2026 Tw93，全文见 [LICENSE](LICENSE) |
| 上游记录 | 本机 `~/.agents/.skill-lock.json` 记为 `waza-learn`，来源 `tw93/Waza`，`skillPath` 为 `skills/learn/SKILL.md` |

## 更新

```bash
curl -fsSL https://raw.githubusercontent.com/tw93/Waza/main/skills/learn/SKILL.md -o skills/learn/SKILL.md
shasum -a 256 skills/learn/SKILL.md
```

更新后改上表的 commit 与 sha256，再跑 `bash scripts/validate.sh`。

## 不要就地改

要改这个技能的行为，改上游，或者在自己的技能里覆盖它。就地改 vendor 文件后，下一次同步就丢改动。
