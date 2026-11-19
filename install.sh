#!/usr/bin/env bash
# 把仓库里的技能复制到 DSH 技能目录（默认 ~/.dsh/skills）。
#
# 用法：
#   ./install.sh                  复制全部技能
#   ./install.sh ste100-style     只复制指定技能（可以写多个）
#   ./install.sh --check          只比对仓库与目标目录，不写文件；有差异退出码 1
#   ./install.sh --dry-run        只打印会复制的技能
#   ./install.sh --force <name>   别的技能目录已有同名技能时，仍然装这一份
#
# 环境变量：
#   DSH_SKILLS_DIR  目标目录，默认 $HOME/.dsh/skills
#
# 复制语义：合并写入，不删除目标目录里已有的文件。因此本机独有的
# ste100-style/assets/*.pdf 不会被覆盖或删除。装完要开新会话，DSH 才加载新技能。
#
# 同名检查：DSH 同时扫 ~/.dsh/skills 与 ~/.agents/skills。目标目录还没装过某个
# 技能、但别的技能根目录已经有同名技能时，默认跳过，避免会话里出现两份同名技能；
# 已经装在目标目录的技能照常同步。要覆盖用 --force。
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_ROOT="$REPO_DIR/skills"
DST_ROOT="${DSH_SKILLS_DIR:-$HOME/.dsh/skills}"

# 别的 agent 的技能根目录。DSH 会同时扫这些目录和 $DST_ROOT，同一个技能名出现
# 两次，会话里就会看到两份。所以装之前先查这里。
EXTERNAL_SKILL_ROOTS=(
  "$HOME/.agents/skills"
  "$HOME/.claude/skills"
  "$HOME/.codex/skills"
  "$HOME/.qoder/skills"
)

# 打印已有同名技能的目录；没有就返回 1。
external_provider() {
  local name="$1" root
  for root in "${EXTERNAL_SKILL_ROOTS[@]}"; do
    if [ "$root" != "$DST_ROOT" ] && [ -f "$root/$name/SKILL.md" ]; then
      printf '%s\n' "$root"
      return 0
    fi
  done
  return 1
}

mode="install"
dry_run=0
force=0
names=()

while [ "$#" -gt 0 ]; do
  case "$1" in
    --check) mode="check" ;;
    --dry-run|--dry) dry_run=1 ;;
    --force) force=1 ;;
    -h|--help) sed -n '2,18p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
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

if [ ! -d "$DST_ROOT" ]; then
  if [ "$mode" = "check" ]; then
    printf '目标目录不存在：%s\n' "$DST_ROOT" >&2
    exit 1
  fi
  if [ "$dry_run" -eq 0 ]; then
    mkdir -p "$DST_ROOT"
  fi
fi

# 不入库的版权文件：比对时忽略，避免把本机独有的 PDF 当成差异。
ignore_pattern='ASD-STE100_ISSUE9\.pdf|STE100_issue9_part1_writing_rules\.txt'

status=0
for name in "${names[@]}"; do
  src="$SRC_ROOT/$name"
  dst="$DST_ROOT/$name"

  if [ ! -f "$src/SKILL.md" ]; then
    printf '跳过 %s：仓库里缺少 SKILL.md\n' "$name" >&2
    status=1
    continue
  fi

  case "$mode" in
    check)
      if [ ! -d "$dst" ]; then
        if ext="$(external_provider "$name")"; then
          printf '外部提供 %s（%s）\n' "$name" "$ext"
        else
          printf '未安装  %s\n' "$name"
          status=1
        fi
        continue
      fi
      diff_out="$(diff -rq "$src" "$dst" 2>/dev/null | grep -Ev "$ignore_pattern" || true)"
      if [ -n "$diff_out" ]; then
        printf '有差异  %s\n' "$name"
        printf '%s\n' "$diff_out" | sed 's/^/        /'
        status=1
      else
        printf '一致    %s\n' "$name"
      fi
      ;;
    install)
      # 只在目标目录还没装过这个技能时才做同名检查。已经装在 $DST_ROOT 的，
      # 说明本机就用这份，照常同步，不受别的根目录影响。
      if [ ! -d "$dst" ] && ext="$(external_provider "$name")" && [ "$force" -eq 0 ]; then
        printf '跳过    %s：%s 已有同名技能，目标目录还没装过（--force 可强制装）\n' "$name" "$ext"
        continue
      fi
      if [ "$dry_run" -eq 1 ]; then
        printf '[dry-run] 复制 %s -> %s\n' "$src" "$dst"
        continue
      fi
      mkdir -p "$dst"
      cp -R "$src/." "$dst/"
      printf '已安装  %s -> %s\n' "$name" "$dst"
      ;;
  esac
done

if [ "$mode" = "check" ] && [ "$status" -ne 0 ]; then
  printf '\n有差异。同步到线上：./install.sh。线上改动收回仓库：./capture.sh。\n'
fi

exit "$status"
