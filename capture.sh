#!/usr/bin/env bash
# 把线上技能目录复制回仓库，用于把 ~/.dsh/skills 里的改动收回 git。
#
# 用法：
#   ./capture.sh               收回全部技能（线上目录里有什么就收什么）
#   ./capture.sh ste100-style  只收回指定技能
#   ./capture.sh --check       只比对，不写文件；有差异退出码 1
#   ./capture.sh --dry-run     只打印会收回的技能
#
# 环境变量：
#   DSH_SKILLS_DIR  源目录，默认 $HOME/.dsh/skills
#
# 复制语义：镜像源目录，仓库里已被线上删除的文件会被删掉。
# 例外：ste100-style/assets 下的两个版权文件不收，也不删本机的副本。
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_ROOT="${DSH_SKILLS_DIR:-$HOME/.dsh/skills}"
DST_ROOT="$REPO_DIR/skills"

mode="capture"
dry_run=0
names=()

while [ "$#" -gt 0 ]; do
  case "$1" in
    --check) mode="check" ;;
    --dry-run|--dry) dry_run=1 ;;
    -h|--help) sed -n '2,14p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
    -*) printf '未知参数：%s\n' "$1" >&2; exit 2 ;;
    *) names+=("$1") ;;
  esac
  shift
done

if [ ! -d "$SRC_ROOT" ]; then
  printf '找不到技能目录：%s\n' "$SRC_ROOT" >&2
  exit 1
fi

if [ "${#names[@]}" -eq 0 ]; then
  for d in "$SRC_ROOT"/*/; do
    [ -d "$d" ] || continue
    names+=("$(basename "$d")")
  done
fi

ignore_pattern='ASD-STE100_ISSUE9\.pdf|STE100_issue9_part1_writing_rules\.txt'

status=0
for name in "${names[@]}"; do
  src="$SRC_ROOT/$name"
  dst="$DST_ROOT/$name"

  if [ ! -f "$src/SKILL.md" ]; then
    printf '跳过 %s：线上缺少 SKILL.md\n' "$name" >&2
    status=1
    continue
  fi

  case "$mode" in
    check)
      if [ ! -d "$dst" ]; then
        printf '仓库没有  %s\n' "$name"
        status=1
        continue
      fi
      diff_out="$(diff -rq "$dst" "$src" 2>/dev/null | grep -Ev "$ignore_pattern" || true)"
      if [ -n "$diff_out" ]; then
        printf '有差异  %s\n' "$name"
        printf '%s\n' "$diff_out" | sed 's/^/        /'
        status=1
      else
        printf '一致    %s\n' "$name"
      fi
      ;;
    capture)
      if [ "$dry_run" -eq 1 ]; then
        printf '[dry-run] 收回 %s -> %s\n' "$src" "$dst"
        continue
      fi
      mkdir -p "$dst"
      if command -v rsync >/dev/null 2>&1; then
        rsync -a --delete \
          --exclude 'ASD-STE100_ISSUE9.pdf' \
          --exclude 'STE100_issue9_part1_writing_rules.txt' \
          "$src/" "$dst/"
      else
        cp -R "$src/." "$dst/"
        rm -f "$dst/assets/ASD-STE100_ISSUE9.pdf" \
              "$dst/assets/STE100_issue9_part1_writing_rules.txt"
      fi
      printf '已收回  %s -> %s\n' "$src" "$dst"
      ;;
  esac
done

if [ "$mode" = "capture" ] && [ "$status" -eq 0 ] && [ "$dry_run" -eq 0 ]; then
  printf '\n检查改动：cd %s && git status --short\n' "$REPO_DIR"
fi

exit "$status"
